☁️ Personal Cloud
A self-hosted cloud storage system that lets you upload, download, and manage your files from anywhere — using your own hardware as the server.

Why? Google Drive has storage limits. iCloud costs money. This runs on a spare laptop you already own, and your speed depends only on your internet connection — not on a third-party server.


How It Works
Your Phone / Laptop (Frontend)
        ↓  HTTP over LAN or internet
  Secondary Laptop (Backend + Storage)
        ↓
     MongoDB (file metadata) + Local Filesystem (actual files)
You run the Flask backend on a secondary machine (your storage server). The React frontend runs on any device and talks to the backend over your local network or the internet.

Features

🔐 Auth — JWT-based signup & login with bcrypt password hashing
📤 Chunked Uploads — Large files are split into 5MB chunks and reassembled server-side (handles files of any size reliably)
📁 File Management — Upload, download, and delete files from a clean dashboard
📊 Storage Usage Bar — Visual indicator of how much space you've used
🎨 File Type Icons — Different icons and colors for images, videos, PDFs, and other files
📱 Responsive Grid — Files displayed in a clean card grid


Tech Stack
LayerTechFrontendReact + Vite + Tailwind CSSBackendPython + FlaskDatabaseMongoDB (file metadata)AuthJWT + bcryptFile StorageLocal filesystem on your server

Project Structure
cloud/
├── backend/
│   ├── app.py              # Flask API (auth, upload, download, delete)
│   ├── uploads/            # Where files are stored on the server
│   ├── .env                # MONGO_URI and SECRET_KEY
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   └── Dashboard.jsx
        └── services/
            └── api.js      # Axios base URL config

Getting Started
Backend (run on your storage machine)
bashcd backend
pip install -r requirements.txt
Create a .env file:
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=your_secret_key_here
Start the server:
bashpython app.py
The server runs on 0.0.0.0:5000 — accessible to all devices on your network.

Frontend (run on your main machine)
bashcd frontend
npm install
npm run dev
In src/services/api.js, point the base URL to your storage machine's local IP:
jsconst API = axios.create({
  baseURL: "http://<your-server-ip>:5000"
});

API Endpoints
MethodEndpointDescriptionPOST/signupCreate a new accountPOST/loginLogin and receive a JWTPOST/upload-chunkUpload a file chunkGET/filesList all your filesGET/download/:idDownload a fileDELETE/delete/:idDelete a file

Environment Variables
VariableDescriptionMONGO_URIYour MongoDB connection stringSECRET_KEYSecret used to sign JWT tokens

Roadmap

 Fix Signup page to match dark theme
 Mobile-friendly UI
 Folder / directory support
 File preview (images, PDFs)
 Search and filter files
 Public share links with expiry
 HTTPS support for remote access


License
MIT