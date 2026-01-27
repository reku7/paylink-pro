import { useEffect, useState } from "react";
import { privateApi } from "../../api/api";
import { useUser } from "../../context/UserContext";

export default function Profile() {
  const { user, setUser } = useUser();
  const [form, setForm] = useState({ name: "", avatar: null });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", avatar: null });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    setSuccess("");

    try {
      const data = new FormData();
      data.append("name", form.name);
      if (form.avatar) data.append("avatar", form.avatar);

      const res = await privateApi.put("/me", data);

      setUser(res.data.user); // 🔥 updates dashboard instantly
      setSuccess("Profile updated successfully");
      if (res.data.user.avatar) setAvatarPreview(res.data.user.avatar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2>Edit Profile</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #10b981",
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#d1fae5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#065f46",
                }}
              >
                {form.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>

        {/* Name */}
        <label>Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Enter your name"
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {success && <p style={{ color: "#059669" }}>{success}</p>}
      </form>
    </div>
  );
}
