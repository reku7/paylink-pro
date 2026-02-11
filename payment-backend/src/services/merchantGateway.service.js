//payment-backend\src\services\merchantGateway.service.js
import Merchant from "../models/Merchant.js";
import { encryptSecret, decryptSecret } from "../utils/crypto.js";

export async function saveChapaSecret(merchantId, plainSecret) {
  const encrypted = encryptSecret(plainSecret);

  await Merchant.updateOne(
    { _id: merchantId },
    {
      $set: {
        "chapa.secretEncrypted": encrypted,
        updatedAt: new Date(),
      },
    },
  );
}

export async function getDecryptedChapaSecret(merchantId) {
  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant?.chapa?.secretEncrypted) {
    throw new Error("Chapa secret not configured");
  }

  return decryptSecret(merchant.chapa.secretEncrypted);
}
