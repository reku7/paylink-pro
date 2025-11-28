export default function requireRole(roles = []) {
  return function (req, res, next) {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(403).json({ error: "Access denied" });
      }

      const userRoles = req.user.roles;

      const hasRole = roles.some((r) => userRoles.includes(r));

      if (!hasRole) {
        return res.status(403).json({ error: "Forbidden: insufficient role" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
}
