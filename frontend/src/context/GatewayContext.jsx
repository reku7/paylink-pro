import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { privateApi as api } from "../api/api";

const GatewayContext = createContext();

export const GatewayProvider = ({ children }) => {
  const [connectedGateways, setConnectedGateways] = useState({
    santimpay: true, // always connected
    chapa: null, // null = unknown/loading
  });
  const [loading, setLoading] = useState(false);

  // Fetch gateways from backend
  const refreshGateways = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/gateways");
      if (res.data.success) {
        setConnectedGateways({
          santimpay: true,
          chapa: res.data.data.chapa === true,
        });
      } else {
        setConnectedGateways({ santimpay: true, chapa: false });
      }
    } catch (err) {
      console.error("Failed to fetch gateways:", err);
      setConnectedGateways({ santimpay: true, chapa: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect Chapa
  const connectChapa = async (apiKey) => {
    if (!apiKey) return { success: false, error: "API Key is required" };
    try {
      setLoading(true);
      const res = await api.post("/gateways/chapa/connect", { apiKey });
      if (res.data.success) {
        await refreshGateways();
        return { success: true };
      } else {
        throw new Error(res.data.error || "Failed to connect Chapa");
      }
    } catch (err) {
      console.error("connectChapa error:", err);
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Chapa
  const disconnectChapa = async () => {
    try {
      setLoading(true);
      const res = await api.post("/gateways/chapa/disconnect");
      if (res.data.success) {
        setConnectedGateways((prev) => ({ ...prev, chapa: false }));
        return { success: true };
      } else {
        throw new Error(res.data.error || "Failed to disconnect Chapa");
      }
    } catch (err) {
      console.error("disconnectChapa error:", err);
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGateways();
  }, [refreshGateways]);

  return (
    <GatewayContext.Provider
      value={{
        connectedGateways,
        loading,
        refreshGateways,
        connectChapa,
        disconnectChapa,
      }}
    >
      {children}
    </GatewayContext.Provider>
  );
};

export const useGateways = () => useContext(GatewayContext);
