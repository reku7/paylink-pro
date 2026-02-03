// frontend/src/utils/auth.js

const TOKEN_KEY = "token";

export function setAuthToken(token) {
  localStorage.setItem("token", token);
}

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export function getUserRole() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.roles && Array.isArray(payload.roles)) {
      // ADD .toUpperCase() HERE
      return payload.roles[0]?.toUpperCase(); // ← CHANGE THIS LINE
    }

    return null;
  } catch {
    return null;
  }
}
