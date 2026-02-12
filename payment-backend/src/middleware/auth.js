import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Malformed authorization header" });
    }

    // ✅ Verify token
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // ✅ Load user from DB (DO NOT trust token fully)
    const user = await User.findById(payload.userId).select("_id roles");

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // ✅ Attach trusted user context
    req.user = {
      id: user._id.toString(),
      merchantId: payload.merchantId || null,
      roles: user.roles,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
