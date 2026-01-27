import { createContext, useContext, useState, useEffect } from "react";
import { privateApi } from "../api/api";
import { getAuthToken } from "../utils/auth";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await privateApi.get("/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
