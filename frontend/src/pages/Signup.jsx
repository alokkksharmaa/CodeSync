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
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-mobile-brand">
              <span className="w-7 h-7 rounded-md bg-accent/15 text-accent-hover flex items-center justify-center">
                <Zap size={14} strokeWidth={2.5} />
              </span>
              <span className="text-xl font-bold tracking-tight text-text-primary font-display">
                CodeSync
              </span>
            </div>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Start collaborating in real time</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                ref={usernameRef}
                className="form-input"
                placeholder="your-name"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full h-12"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner w-5 h-5" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
