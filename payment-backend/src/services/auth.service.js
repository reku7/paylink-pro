// src/services/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";
import { v4 as uuidv4 } from "uuid";
import { encryptSecret } from "../utils/crypto.js"; // use your existing encryption util
import axios from "axios";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is missing. Check your .env file");
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
    algorithm: "HS256",
  });
}

/**
 * Create user + merchant + optional Chapa connection
 */
export async function createUserAndMerchant({
  name,
  email,
  password,
  merchantName,
  preferredGateway = "santimpay",
  business = {},
  chapaApiKey,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const passwordHash = await hashPassword(password);

    // Create User
    const [user] = await User.create([{ name, email, passwordHash }], {
      session,
    });

    // Generate merchant slug
    const base = merchantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${base}-${uuidv4().slice(0, 6)}`;

    // Create Merchant with full business info
    const [merchant] = await Merchant.create(
      [
        {
          ownerUserId: user._id,
          name: merchantName,
          slug,
          status: "active",
          preferredGateway,
          business,
        },
      ],
      { session },
    );

    // Optionally connect Chapa if selected
    if (preferredGateway === "chapa" && chapaApiKey) {
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/chapa`;
      const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

      if (!webhookUrl || !webhookSecret) {
        throw new Error("Webhook URL or secret not configured on server");
      }

      const hashedWebhookSecret = await bcrypt.hash(webhookSecret, 10);

      await Merchant.updateOne(
        { _id: merchant._id },
        {
          $set: {
            "chapa.secretEncrypted": encryptSecret(chapaApiKey),
            webhookUrl,
            webhookSecretHash: hashedWebhookSecret,
          },
        },
        { session },
      );

      // Optional: you can call Chapa API here to validate the API key
      // await axios.post("https://api.chapa.co/v1/validate", { apiKey: chapaApiKey });
    }

    await session.commitTransaction();

    const token = signToken({
      userId: user._id,
      merchantId: merchant._id,
      roles: user.roles,
    });

    return { user, merchant, token };
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
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
