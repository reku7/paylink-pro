import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// import Merchant from "../models/Merchant";

// export const auth = async (req, resizeBy, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];

//     if (!token) return res.status(401).json({ message: "No token provided" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.merchant = await Merchant.findById(decoded.merchantId).select(
//       "-password"
//     );

//     next();
//   } catch (err) {
//     res.status(401).json({ mesage: "Invalid tken" });
//   }
// };

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(401).json({ error: "Malformed token" });

    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: payload.userId,
      merchantId: payload.merchantId,
      roles: payload.roles || [],
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
