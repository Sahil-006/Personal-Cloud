import { useState, useEffect, useRef } from "react";
import {
  Upload, FileText, Trash2, HardDrive,
  Image, Film, File, LogOut, CloudOff, CheckCircle2,
  Loader2, Download
} from "lucide-react";
import API from "../services/api";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (format) => {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(format))
    return <Image size={32} className="text-blue-400" />;
  if (["mp4", "mov", "avi", "mkv"].includes(format))
    return <Film size={32} className="text-purple-400" />;
  if (format === "pdf")
    return <FileText size={32} className="text-red-400" />;
  return <File size={32} className="text-gray-400" />;
};

const getFileColor = (format) => {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(format))
    return "border-blue-500/30 bg-blue-500/5";
  if (["mp4", "mov", "avi", "mkv"].includes(format))
    return "border-purple-500/30 bg-purple-500/5";
  if (format === "pdf")
    return "border-red-500/30 bg-red-500/5";
  return "border-gray-500/30 bg-gray-500/5";
};

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxBytes = 10 * 1024 * 1024 * 1024;
  const usagePercent = Math.min((totalBytes / maxBytes) * 100, 100).toFixed(1);

  const fetchFiles = async () => {
    try {
      const res = await API.get("/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileId = `${Date.now()}-${file.name}`;

  setUploading(true);
  setUploadProgress(0);
  setUploadStatus(null);

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("fileName", file.name);
      formData.append("chunkIndex", i);
      formData.append("totalChunks", totalChunks);
      formData.append("fileId", fileId);

      await API.post("/upload-chunk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    setUploadStatus("success");
    await fetchFiles();
  } catch (err) {
    console.error(err);
    setUploadStatus("error");
  } finally {
    setUploading(false);
    fileInputRef.current.value = "";
    setTimeout(() => setUploadStatus(null), 3000);
  }
};

  const handleDownload = async (fileId, filename) => {
    setDownloadingId(fileId);
    try {
      const response = await API.get(`/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (fileId) => {
    setDeletingId(fileId);
    try {
      await API.delete(`/delete/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="flex h-screen bg-[#0e0e10] text-white overflow-hidden"
    >
      {/* Sidebar */}
      <div className="w-64 bg-[#141416] border-r border-white/5 flex flex-col p-5">
        <div className="mb-8">
          <h1 className="text-lg font-bold tracking-tight text-white">☁️ Personal Cloud</h1>
          <p className="text-xs text-white/30 mt-0.5">Your private storage</p>
        </div>

        <label
          className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium mb-4
            ${uploading
              ? "border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
              : "border-white/20 bg-white/5 hover:bg-white/10 text-white hover:border-white/40"
            }`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? `Uploading ${uploadProgress}%` : "Upload File"}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {uploading && (
          <div className="mb-4">
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="flex items-center gap-2 text-green-400 text-xs mb-4 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} /> Uploaded successfully
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            <CloudOff size={14} /> Upload failed
          </div>
        )}

        <div className="flex-1" />

        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
              {username?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-sm text-white/70 truncate max-w-[100px]">{username}</span>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
            className="text-white/30 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-white/30 text-sm mt-1">
            {files.length} file{files.length !== 1 ? "s" : ""} stored
          </p>
        </div>

        <div className="mx-8 mb-6 bg-[#141416] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HardDrive size={16} className="text-white/50" />
              Storage Usage
            </div>
            <span className="text-xs text-white/40">{formatBytes(totalBytes)} used</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-700"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2">{usagePercent}% of 10 GB display limit</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">
            Your Files
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-white/20">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/20 border border-white/5 rounded-2xl">
              <CloudOff size={32} className="mb-2" />
              <p className="text-sm">No files yet. Upload something!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file._id}
                  className={`border rounded-2xl p-4 transition-all hover:border-white/20 group ${getFileColor(file.format)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    {getFileIcon(file.format)}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleDownload(file._id, file.name)}
                        disabled={downloadingId === file._id}
                        className="text-white/20 hover:text-blue-400 transition"
                        title="Download"
                      >
                        {downloadingId === file._id ? (
                          <Loader2 size={16} className="animate-spin text-blue-400" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(file._id)}
                        disabled={deletingId === file._id}
                        className="text-white/20 hover:text-red-400 transition"
                        title="Delete"
                      >
                        {deletingId === file._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <h4 className="font-medium text-sm text-white truncate" title={file.name}>
                    {file.name}
                  </h4>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-white/30">{formatBytes(file.size)}</p>
                    <span className="text-xs text-white/20 uppercase tracking-wider">
                      {file.format || "file"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;