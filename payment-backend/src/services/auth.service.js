// src/services/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose"; // needed for transactions
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain password with hashed password
 */

console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Create a new user and merchant atomically using MongoDB transaction
 */
export async function createUserAndMerchant({
  name,
  email,
  password,
  merchantName,
}) {
  const session = await mongoose.startSession();
  session.startTransaction(); // start transaction

  try {
    // 1️⃣ Hash password
    const passwordHash = await hashPassword(password);

    // 2️⃣ Create User within transaction
    const [user] = await User.create([{ name, email, passwordHash }], {
      session,
    });

    // 3️⃣ Generate slug for merchant
    const base = merchantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${base}-${uuidv4().slice(0, 6)}`;

    // 4️⃣ Create Merchant within transaction
    const [merchant] = await Merchant.create(
      [
        {
          ownerUserId: user._id,
          name: merchantName,
          slug,
          status: "active",
        },
      ],
      { session }
    );

    // 5️⃣ Commit transaction
    await session.commitTransaction();

    // 6️⃣ Sign JWT token
    const token = signToken({
      userId: user._id,
      merchantId: merchant._id,
      roles: user.roles,
    });
    console.log("JWT_SECRET when signing:", JWT_SECRET);

    return { user, merchant, token };
  } catch (error) {
    // ❗ FIX: Abort only if transaction is still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    // Always end session
    session.endSession();
  }
}

/**
 * Login existing user
 */
export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("Invalid credentials");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  const merchant = await Merchant.findOne({ ownerUserId: user._id });

  const token = signToken({
    userId: user._id,
    merchantId: merchant?._id,
    roles: user.roles,
  });

  return { user, merchant, token };
}
