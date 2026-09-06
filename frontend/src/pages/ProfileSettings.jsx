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
    <div className="min-h-screen bg-(--bg-base) text-(--text-primary)">
      <header className="sticky top-0 z-50 border-b border-(--border-color) bg-(--bg-surface)">
        <div className="mx-auto flex max-w-180 items-center gap-4 px-6 py-3.5">
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-base font-semibold">Profile &amp; Settings</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-180 flex-col gap-6 px-6 py-8">
        {/* Profile */}
        <section className="card">
          <h2 className="section-title">Profile</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="profile-avatar shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  profile.username?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="form-group mb-0 flex-1">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
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
              <div className="form-group mb-0">
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

            <div className="flex justify-end">
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

        {/* Editor Preferences */}
        <section className="card">
          <h2 className="section-title">Editor Preferences</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="form-group mb-0">
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
              <div className="form-group mb-0">
                <label className="form-label">Key Binding</label>
                <select
                  className="form-input form-select"
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
              <div className="form-group mb-0">
                <label className="form-label">Default Language</label>
                <select
                  className="form-input form-select"
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
            <div className="flex justify-end">
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

        {/* Change Password */}
        <section className="card">
          <h2 className="section-title">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <div className="form-group mb-0">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
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
              <div className="form-group mb-0">
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
            <div className="flex justify-end">
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

        {/* Danger Zone */}
        <section className="card danger-card">
          <h2 className="section-title text-error">Danger Zone</h2>
          <p className="section-description">
            Permanently delete your account and all associated data. This cannot
            be undone.
          </p>
          <div className="form-group mb-4">
            <label className="form-label">
              Type your username{" "}
              <strong className="text-(--text-primary)">
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
          <div className="flex justify-end">
            <button
              className="btn btn-error"
              onClick={handleDelete}
              disabled={confirmDelete !== user?.username}
            >
              Delete Account
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfileSettings;
