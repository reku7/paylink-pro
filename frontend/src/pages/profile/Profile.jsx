import { useEffect, useState } from "react";
import { privateApi } from "../../api/api";
import { useUser } from "../../context/userContext";

export default function Profile() {
  const { user, setUser } = useUser();
  const [form, setForm] = useState({
    name: "",
    avatarFile: null,
    avatarPreview: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Initialize form
  useEffect(() => {
    if (user) {
      const avatarUrl =
        user.avatar && !user.avatar.startsWith("http")
          ? `${import.meta.env.VITE_API_URL}${user.avatar}`
          : user.avatar || null;
      setForm({
        name: user.name || "",
        avatarFile: null,
        avatarPreview: avatarUrl,
      });
    }
  }, [user]);

  // Handle file change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: URL.createObjectURL(file),
    }));
  };

  // Cancel changes
  const handleCancel = () => {
    if (user) {
      const avatarUrl =
        user.avatar && !user.avatar.startsWith("http")
          ? `${import.meta.env.VITE_API_URL}${user.avatar}`
          : user.avatar || null;
      setForm({
        name: user.name || "",
        avatarFile: null,
        avatarPreview: avatarUrl,
      });
      setMessage("");
    }
  };

  // Submit changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setMessage("Please enter a name");

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("name", form.name.trim());
      if (form.avatarFile) data.append("avatar", form.avatarFile);

      const res = await privateApi.put("/me", data);
      let updatedUser = res.data.user;
      if (updatedUser.avatar && !updatedUser.avatar.startsWith("http")) {
        updatedUser.avatar = `${import.meta.env.VITE_API_URL}${updatedUser.avatar}`;
      }

      setUser(updatedUser);
      setForm((prev) => ({ ...prev, avatarFile: null }));
      setMessage(res.data.message || "Profile updated!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Revoke preview URL on unmount
  useEffect(
    () => () => {
      form.avatarPreview?.startsWith("blob:") &&
        URL.revokeObjectURL(form.avatarPreview);
    },
    [form.avatarPreview],
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              {form.avatarPreview ? (
                <img
                  src={form.avatarPreview}
                  alt="Avatar"
                  style={styles.avatarImg}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {form.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label style={styles.label}>Change Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={styles.inputFile}
              />
              <p style={styles.helperText}>JPG, PNG (Max 5MB)</p>
            </div>
          </div>

          {/* Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              style={styles.inputField}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                ...styles.message,
                background: message.includes("Failed") ? "#fee2e2" : "#d1fae5",
                color: message.includes("Failed") ? "#dc2626" : "#059669",
                border: message.includes("Failed")
                  ? "1px solid #fca5a5"
                  : "1px solid #10b981",
              }}
            >
              {message}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={loading} style={styles.saveButton}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles (unchanged except added cancelButton)
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: 40,
    background: "#f3f4f6",
    minHeight: "100vh",
  },
  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: 500,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  avatarSection: { display: "flex", alignItems: "center", gap: 20 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #10b981",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#d1fae5",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: { fontSize: 36, fontWeight: "bold", color: "#065f46" },
  label: { display: "block", marginBottom: 8, fontWeight: 500 },
  inputFile: { padding: 8, cursor: "pointer" },
  helperText: { fontSize: 12, color: "#666", marginTop: 4 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  inputField: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 16,
    outline: "none",
  },
  message: { padding: 12, borderRadius: 8 },
  saveButton: {
    flex: 1,
    padding: 14,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
