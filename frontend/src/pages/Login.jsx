import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, CloudOff } from "lucide-react";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    setError("");

    try {
      const response = await API.post("/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="h-screen flex items-center justify-center bg-[#0e0e10]"
    >
      <div className="w-full max-w-sm px-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">☁️</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Personal Cloud</h1>
          <p className="text-white/30 text-sm mt-1">Access your files anywhere</p>
        </div>

        {/* Card */}
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <CloudOff size={14} /> {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-3 rounded-xl text-sm focus:outline-none focus:border-white/30 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="text-xs text-white/40 mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-3 rounded-xl text-sm focus:outline-none focus:border-white/30 transition"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold p-3 rounded-xl text-sm hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingIn ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/30 mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-white font-semibold hover:text-white/70 transition">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;