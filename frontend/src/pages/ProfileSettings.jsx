import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/profileApi";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "go",
  "rust",
  "html",
  "css",
];

const ProfileSettings = () => {
  const { user, login: setAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    avatar: "",
    preferences: {
      fontSize: 14,
      keyBinding: "default",
      defaultLanguage: "javascript",
    },
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    getProfile()
      .then((data) =>
        setProfile({
          username: data.username || "",
          email: data.email || "",
          avatar: data.avatar || "",
          preferences: {
            fontSize: 14,
            keyBinding: "default",
            defaultLanguage: "javascript",
            ...data.preferences,
          },
        }),
      )
      .catch(() => toast.error("Failed to load profile"));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        preferences: profile.preferences,
      });
      const stored = JSON.parse(localStorage.getItem("codesync_user") || "{}");
      setAuth({
        token: localStorage.getItem("codesync_token"),
        user: { ...stored, username: res.user.username, email: res.user.email },
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm)
      return toast.error("Passwords do not match");
    if (passwords.next.length < 6)
      return toast.error("Password must be at least 6 characters");
    setSaving(true);
    try {
      await updateProfile({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete !== user?.username)
      return toast.error("Username does not match");
    try {
      await import("../services/api").then((m) =>
        m.default.delete(`/api/auth/${user.id}`),
      );
      logout();
      navigate("/login");
      toast.success("Account deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Profile &amp; Settings
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ── Profile ── */}
        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 20,
            }}
          >
            Profile
          </h2>
          <form
            onSubmit={handleProfileSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  border: "2px solid var(--accent-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  profile.username?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Avatar URL</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={profile.avatar}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, avatar: e.target.value }))
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  required
                  minLength={3}
                  maxLength={30}
                  value={profile.username}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, username: e.target.value }))
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Editor Preferences ── */}
        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 20,
            }}
          >
            Editor Preferences
          </h2>
          <form
            onSubmit={handleProfileSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Font Size</label>
                <input
                  className="form-input"
                  type="number"
                  min={10}
                  max={32}
                  value={profile.preferences.fontSize}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      preferences: {
                        ...p.preferences,
                        fontSize: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Key Binding</label>
                <select
                  className="form-input"
                  value={profile.preferences.keyBinding}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      preferences: {
                        ...p.preferences,
                        keyBinding: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="default">Default</option>
                  <option value="vim">Vim</option>
                  <option value="emacs">Emacs</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Default Language</label>
                <select
                  className="form-input"
                  value={profile.preferences.defaultLanguage}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      preferences: {
                        ...p.preferences,
                        defaultLanguage: e.target.value,
                      },
                    }))
                  }
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Preferences"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Change Password ── */}
        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 20,
            }}
          >
            Change Password
          </h2>
          <form
            onSubmit={handlePasswordSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                required
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  required
                  minLength={6}
                  value={passwords.next}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, next: e.target.value }))
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  required
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  }
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Danger Zone ── */}
        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f87171",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            Danger Zone
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Permanently delete your account and all associated data. This cannot
            be undone.
          </p>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">
              Type your username{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {user?.username}
              </strong>{" "}
              to confirm
            </label>
            <input
              className="form-input"
              placeholder={user?.username}
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn"
              onClick={handleDelete}
              disabled={confirmDelete !== user?.username}
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileSettings;
