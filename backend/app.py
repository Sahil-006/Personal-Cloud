from flask import Flask, request, jsonify, send_from_directory
import bcrypt
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
import os
import jwt
import datetime
import uuid
import shutil

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "your_secret_key")
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 * 1024 

@app.errorhandler(413)
def too_large(e):
    return jsonify({"message": "File too large"}), 413

# ─── Folder where files will be saved on your spare laptop ───
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── MongoDB ───
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["personal_cloud"]
users_collection = db["users"]
files_collection = db["files"]


# ─── Helper: decode JWT from request ───
def get_user_id():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    try:
        decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return decoded["user_id"]
    except:
        return None


@app.route("/")
def home():
    return jsonify({"message": "Personal Cloud Server Running ✅"})


# ─── Signup ───
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    existing_user = users_collection.find_one({
        "$or": [{"email": email}, {"username": username}]
    })

    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "username": username,
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User created successfully"}), 201


# ─── Login ───
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"message": "User not found"}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid password"}), 401

    token = jwt.encode({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
    }, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "username": user["username"]
    }), 200


@app.route("/storage-info", methods=["GET"])
def storage_info():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    usage = shutil.disk_usage(UPLOAD_FOLDER)
    return jsonify({
        "total": usage.total,
        "used": usage.used,
        "free": usage.free
    }), 200

# ─── Upload ───
@app.route("/upload", methods=["POST"])
def upload_file():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["file"]
    original_name = file.filename

    # Give it a unique name so duplicates don't overwrite each other
    ext = os.path.splitext(original_name)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"

    save_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(save_path)

    file_size = os.path.getsize(save_path)

    files_collection.insert_one({
        "user_id": user_id,
        "name": original_name,
        "stored_name": unique_name,
        "size": file_size,
        "format": ext.lstrip(".").lower(),
        "uploaded_at": datetime.datetime.now(datetime.UTC)
    })

    return jsonify({
        "message": "File uploaded successfully",
        "filename": unique_name
    }), 200
    
@app.route("/upload-chunk", methods=["POST"])
def upload_chunk():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    chunk = request.files.get("file")
    file_name = request.form.get("fileName")
    chunk_index = int(request.form.get("chunkIndex"))
    total_chunks = int(request.form.get("totalChunks"))
    file_id = request.form.get("fileId")

    # Save chunk to temp folder
    temp_dir = os.path.join(UPLOAD_FOLDER, "temp", file_id)
    os.makedirs(temp_dir, exist_ok=True)
    chunk.save(os.path.join(temp_dir, f"chunk_{chunk_index}"))

    # If all chunks received, assemble the file
    if chunk_index == total_chunks - 1:
        ext = os.path.splitext(file_name)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        final_path = os.path.join(UPLOAD_FOLDER, unique_name)

        with open(final_path, "wb") as final_file:
            for i in range(total_chunks):
                chunk_path = os.path.join(temp_dir, f"chunk_{i}")
                with open(chunk_path, "rb") as c:
                    final_file.write(c.read())

        # Cleanup temp chunks
        import shutil
        shutil.rmtree(temp_dir)

        file_size = os.path.getsize(final_path)
        files_collection.insert_one({
            "user_id": user_id,
            "name": file_name,
            "stored_name": unique_name,
            "size": file_size,
            "format": ext.lstrip(".").lower(),
            "uploaded_at": datetime.datetime.now(datetime.UTC)
        })

    return jsonify({"message": "Chunk received"}), 200


# ─── List Files ───
@app.route("/files", methods=["GET"])
def get_files():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    files = list(files_collection.find({"user_id": user_id}))
    for f in files:
        f["_id"] = str(f["_id"])
        f.pop("uploaded_at", None)

    return jsonify({"files": files}), 200


# ─── Download ───
@app.route("/download/<file_id>", methods=["GET"])
def download_file(file_id):
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    file = files_collection.find_one({
        "_id": ObjectId(file_id),
        "user_id": user_id
    })

    if not file:
        return jsonify({"message": "File not found"}), 404

    return send_from_directory(
        UPLOAD_FOLDER,
        file["stored_name"],
        as_attachment=True,
        download_name=file["name"]
    )


# ─── Delete ───
@app.route("/delete/<file_id>", methods=["DELETE"])
def delete_file(file_id):
    user_id = get_user_id()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    file = files_collection.find_one({
        "_id": ObjectId(file_id),
        "user_id": user_id
    })

    if not file:
        return jsonify({"message": "File not found"}), 404

    file_path = os.path.join(UPLOAD_FOLDER, file["stored_name"])
    if os.path.exists(file_path):
        os.remove(file_path)

    files_collection.delete_one({"_id": ObjectId(file_id)})

    return jsonify({"message": "File deleted"}), 200


if __name__ == "__main__":
    # host="0.0.0.0" makes it accessible on your local network
    app.run(host="0.0.0.0", port=5000, debug=True)