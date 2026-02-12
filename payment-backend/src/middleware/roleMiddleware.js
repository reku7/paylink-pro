export default function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles)) {
      return res.status(403).json({ error: "Access denied: no roles found" });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}
