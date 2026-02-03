import { useEffect, useState } from "react";
import { privateApi as api } from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const res = await api.get("/admin/merchants");
        setMerchants(res.data.merchants || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load merchants");
      } finally {
        setLoading(false);
      }
    }

    fetchMerchants();
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>System-level overview and merchant management</p>
      </header>

      {loading && <p>Loading merchants...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && (
        <section style={styles.card}>
          <h2>Registered Merchants</h2>

          {merchants.length === 0 ? (
            <p>No merchants found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m._id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        style={styles.link}
                        onClick={() =>
                          navigate(`/admin/merchants?merchantId=${m._id}`)
                        }
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 40,
    background: "#f9fafb",
    minHeight: "100vh",
  },
  header: {
    marginBottom: 32,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 16,
  },
  error: {
    color: "#dc2626",
  },
  link: {
    background: "none",
    border: "none",
    color: "#059669",
    cursor: "pointer",
    fontWeight: 600,
  },
};
