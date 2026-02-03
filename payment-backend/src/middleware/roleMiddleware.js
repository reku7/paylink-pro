export default function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles)) {
      return res.status(403).json({ error: "Access denied: no roles found" });
    }

    // Convert both arrays to lowercase
    const userRoles = req.user.roles.map((r) => r.toLowerCase());
    const rolesAllowed = allowedRoles.map((r) => r.toLowerCase());

    const hasRole = userRoles.some((role) => rolesAllowed.includes(role));

    if (!hasRole) {
      console.log(
        "User roles:",
        req.user.roles,
        "Allowed roles:",
        allowedRoles,
      );
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}
