import { useLocation } from "react-router-dom";

export default function PublicFailed() {
  const params = new URLSearchParams(useLocation().search);
  const linkId = params.get("linkId");

  const retryPayment = async () => {
    if (!linkId) {
      alert("Payment link ID missing.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments/public/start/${linkId}`,
        { method: "POST" },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start payment");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      alert("Failed to retry payment");
    }
  };

  return (
    <div className="payment-card failed">
      <h1>⚠️ Payment Not Completed</h1>
      <p>The payment was cancelled or could not be completed.</p>

      <button onClick={retryPayment} disabled={!linkId}>
        Retry Payment
      </button>
    </div>
  );
}
