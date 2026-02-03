import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(401).json({ error: "Malformed token" });

    const token = parts[1];

    console.log("AUTH MIDDLEWARE SECRET:", JWT_SECRET);
    // console.log("REQ TOKEN:", token);

    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.user = {
      id: payload.userId,
      merchantId: payload.merchantId,
      roles: payload.roles || [],
    };
    console.log("User attached by authMiddleware:", req.user);

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
