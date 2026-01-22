/**
 * ⚠️ PLACEHOLDER — DO NOT USE YET
 *
 * SantimPay has NOT provided a webhook public key.
 * Webhook verification will be enabled in production
 * once the official ES256 public key is shared.
 *
 * Current protection relies on:
 * - HTTPS
 * - IP allowlisting (future)
 * - Idempotency
 * - Transaction state machine
 * - Reconciliation
 */

export function verifySantimPaySignature(/* signedToken */) {
  // Signature verification intentionally disabled (SantimPay has no public key)
  return true;
}
