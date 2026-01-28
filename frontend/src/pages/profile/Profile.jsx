import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateApi } from "../../api/api";
import { useUser } from "../../context/userContext";

export default function Profile({ onCancel }) {
  const navigate = useNavigate(); // ✅ initialize navigate
  const { user, setUser } = useUser();
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* =======================
     Load user data
  ======================= */
  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setAvatarPreview(user.avatar || null); // ✅ use normalized avatar from context
  }, [user]);

  /* =======================
     Handle avatar change
  ======================= */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /* =======================
     Cancel changes
  ======================= */
  setName(user?.name || "");
  setAvatarPreview(
    user?.avatar?.startsWith("http")
      ? user.avatar
      : user.avatar
        ? `${import.meta.env.VITE_API_BASE_URL}${user.avatar}`
        : null
  );
  setAvatarFile(null);
  setMessage("");

  // Navigate back to dashboard home
  navigate("/dashboard");

  // Call parent callback if provided
  onCancel?.();
};

  /* =======================
     Submit form
  ======================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await privateApi.put("/me", formData);

      // ✅ directly use the returned avatar (already relative path)
      setUser(res.data.user);
      setAvatarFile(null);
      setMessage(res.data.message || "Profile updated successfully!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Cleanup blob URLs
  ======================= */
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Edit Profile</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={styles.avatarImg}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {name?.charAt(0)?.toUpperCase() || "U"}
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
              <p style={styles.helperText}>JPG, PNG (Max 2MB)</p>
            </div>
          </div>

          {/* Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.inputField}
              placeholder="Your name"
            />
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                ...styles.message,
                background: message.toLowerCase().includes("fail")
                  ? "#fee2e2"
                  : "#d1fae5",
                color: message.toLowerCase().includes("fail")
                  ? "#dc2626"
                  : "#059669",
                border: message.toLowerCase().includes("fail")
                  ? "1px solid #fca5a5"
                  : "1px solid #10b981",
              }}
            >
              {message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
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

/* =======================
   Styles (unchanged)
======================= */
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: 40,
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: 500,
  },
  heading: { marginBottom: 20 },
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
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    background: "#f87171",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
