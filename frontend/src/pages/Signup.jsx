import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { Zap, Eye, EyeOff } from "lucide-react";

const ROTATING_WORDS = ["build", "share", "manage", "code"];

const AnimatedWord = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`auth-hero-word ${visible ? "word-visible" : "word-hidden"}`}
    >
      {ROTATING_WORDS[index]}
    </span>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = form;
    if (!username || !email || !password) {
      toast.error("All fields are required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { username, email, password });
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* ─── Left: Hero Panel ─── */}
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <div className="auth-hero-glow" />
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <Zap size={14} strokeWidth={2.5} />
            <span>CodeSync</span>
          </div>
          <h1 className="auth-hero-headline">
            A platform where
            <br />
            you can <AnimatedWord />
          </h1>
          <p className="auth-hero-sub">
            Real-time collaboration for developers who ship fast.
          </p>
        </div>
      </div>

      {/* ─── Right: Form ─── */}
      <div className="auth-form-panel flex-1 flex items-center justify-center p-8 bg-[#0B0C10] relative z-10 w-full lg:w-1/2 border-l border-gray-800">
        <div className="auth-card">
          <div className="auth-header mb-8 text-center max-w-sm mx-auto">
            <div className="auth-mobile-brand flex items-center justify-center gap-2 mb-6 md:hidden">
              <span className="w-7 h-7 rounded-md bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Zap size={14} strokeWidth={2.5} />
              </span>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                CodeSync
              </span>
            </div>
            <h1 className="auth-title text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 font-display">
              Create account
            </h1>
            <p className="auth-subtitle text-lg text-gray-400">
              Start collaborating in real time
            </p>
          </div>

          <form
            className="auth-form flex flex-col gap-5 max-w-sm mx-auto w-full"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-group flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="form-label text-sm font-medium text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                ref={usernameRef}
                className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all backdrop-blur-sm"
                placeholder="your-name"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="form-label text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all backdrop-blur-sm"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="form-label text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="password-input-wrapper relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all backdrop-blur-sm pr-12"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle absolute right-3 text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-white/5 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full h-12 mt-2 rounded-lg text-lg font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center ${loading ? "opacity-80 pointer-events-none" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-footer mt-8 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="auth-link text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
