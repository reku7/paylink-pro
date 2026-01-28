import { createContext, useContext, useState, useEffect } from "react";
import { privateApi } from "../api/api";
import { getAuthToken } from "../utils/auth";
import { getAvatarUrl } from "../utils/avatarUrl";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    return {
      ...rawUser,
      avatar: getAvatarUrl(rawUser.avatar), // always full URL
    };
  };

  const fetchUser = async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await privateApi.get("/me");
      setUser(normalizeUser(res.data.user));
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user once when provider mounts
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: (u) => setUser(normalizeUser(u)),
        fetchUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
