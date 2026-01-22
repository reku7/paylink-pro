import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(process.env.MERCHANT_SECRET_ENCRYPTION_KEY, "base64");

if (KEY.length !== 32) {
  throw new Error("MERCHANT_SECRET_ENCRYPTION_KEY must be 32 bytes");
}

export function encryptSecret(plainText) {
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
  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(encryptedObj.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(encryptedObj.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedObj.content, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
