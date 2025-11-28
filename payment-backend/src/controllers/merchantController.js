// import Merchant from "../models/Merchant.js";
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";

// export const registerMerchant = async (req, res, next) => {
//   try {
//     const { name, email, password } = req.body;

//     const existing = await Merchant.findOne({ email });
//     if (existing)
//       return res.status(400).json({ message: "Email already exists" });

//     const hashed = await bcrypt.hash(password, 10);
//     const apiKey = "API_" + uuidv4().replace(/-/g, "").slice(0, 32);

//     const merchant = await Merchant.create({
//       name,
//       email,
//       password: hashed,
//       apiKey,
//     });

//     res.status(201).json({
//       message: "Merchant registered",
//       merchant: {
//         id: merchant._id,
//         name: merchant.name,
//         email: merchant.email,
//         apiKey: merchant.apiKey,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const loginMerchant = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const merchant = await Merchant.findOne({ email });
//     if (!merchant)
//       return res.status(404).json({ message: "Merchant not found" });

//     const isMatch = await bcrypt.compare(password, merchant.password);
//     if (!isMatch)
//       return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { merchantId: merchant._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successfull",
//       token,
//       merchant: {
//         id: merchant._id,
//         name: merchant.name,
//         email: merchant.email,
//         apiKey: merchant.apiKey,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
