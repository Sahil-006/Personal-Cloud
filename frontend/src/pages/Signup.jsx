import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, CloudOff } from "lucide-react";
import API from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async () => {
    if (signingUp) return;
    setSigningUp(true);
    setError("");
    try {
      const response = await API.post("/signup", formData);
      alert(response.data.message);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setSigningUp(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignup();
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
          <p className="text-white/30 text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <CloudOff size={14} /> {error}
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Username</label>
            <input
              type="text"
              name="username"
              placeholder="yourname"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-3 rounded-xl text-sm focus:outline-none focus:border-white/30 transition"
            />
          </div>

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

          <button
            onClick={handleSignup}
            disabled={signingUp}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold p-3 rounded-xl text-sm hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingUp ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </div>

        <p className="text-center text-sm text-white/30 mt-5">
          Already have an account?{" "}
          <Link to="/" className="text-white font-semibold hover:text-white/70 transition">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;