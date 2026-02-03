// payment-backend/src/utils/crypto.js
import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey() {
  const key = process.env.MERCHANT_SECRET_ENCRYPTION_KEY;
  if (!key) throw new Error("MERCHANT_SECRET_ENCRYPTION_KEY is not defined");
  const bufferKey = Buffer.from(key, "base64");
  if (bufferKey.length !== 32) {
    throw new Error("MERCHANT_SECRET_ENCRYPTION_KEY must be 32 bytes");
  }
  return bufferKey;
}

export function encryptSecret(plainText) {
  const KEY = getKey(); // load key here
  const iv = crypto.randomBytes(12); // recommended for GCM
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    content: encrypted.toString("base64"),
    tag: authTag.toString("base64"),
  };
}

export function decryptSecret(encryptedObj) {
  const KEY = getKey(); // load key here
  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(encryptedObj.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(encryptedObj.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedObj.content, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
