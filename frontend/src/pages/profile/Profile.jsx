import { useEffect, useState } from "react";
import { privateApi } from "../../api/api";

export default function Profile() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    privateApi.get("/me").then((res) => {
      setForm({
        name: res.data.user.name || "",
        email: res.data.user.email,
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      const res = await privateApi.put("/me", {
        name: form.name,
      });

      setSuccess(res.data.message);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { name, email } = form;

  return (
    <div className="profile-page">
      <h2>Edit Profile</h2>

      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label>Email</label>
        <input value={email} disabled />

        <button disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {success && <p className="success">{success}</p>}
      </form>
    </div>
  );
}
