import { useEffect, useState } from "react";
import { privateApi } from "../../api/api";
import { useUser } from "../../context/UserContext";

export default function Profile() {
  const { user, setUser } = useUser();
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      // Make avatar absolute URL if coming from backend
      if (user.avatar && !user.avatar.startsWith("http")) {
        setAvatarPreview(`${import.meta.env.VITE_API_URL}${user.avatar}`);
      } else {
        setAvatarPreview(user.avatar || null);
      }
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage("Please enter a name");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await privateApi.put("/me", formData);

      // Ensure avatar URL is absolute
      let updatedUser = res.data.user;
      if (updatedUser.avatar && !updatedUser.avatar.startsWith("http")) {
        updatedUser.avatar = `${import.meta.env.VITE_API_URL}${updatedUser.avatar}`;
      }

      setUser(updatedUser);
      setMessage(res.data.message || "Profile updated!");
      setAvatarFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Edit Profile</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Avatar Section */}
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
                  {name.charAt(0).toUpperCase()}
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

          {/* Name Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          {/* Submit */}
          <button type="submit" disabled={loading} style={styles.saveButton}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Styles
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
    padding: 14,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
