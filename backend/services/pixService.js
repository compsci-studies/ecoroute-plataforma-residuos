import crypto from "crypto";
import { randomUUID } from "crypto";

/**
 * Demonstrative Pix/PagSeguro service.
 *
 * This module intentionally does not charge a real card, boleto or Pix key.
 * It models the integration contract that the EcoRoute backend would use with
 * a Brazilian gateway: server-side amount validation, signed checkout payload,
 * callback verification, idempotency key and payment reference.
 */

function getConfig() {
  return {
    merchantId: process.env.PAGSEGURO_MERCHANT_ID || "ECOROUTE-DEMO",
    secretKey: process.env.PAGSEGURO_SECRET_KEY || "ecoroute-pagseguro-demo-secret",
    backendUrl: process.env.BACKEND_URL || "http://localhost:5001",
  };
}

function normalizeAmount(amount, context) {
  const totalAmount = Number(amount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error(`Invalid amount for ${context}`);
  }
  return Number(totalAmount.toFixed(2));
}

function sign(message, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(message, "utf8").digest("base64");
}

function safeCompareSignatures(a, b) {
  try {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const bufA = Buffer.from(a, "base64");
    const bufB = Buffer.from(b, "base64");
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function buildSignedDemoCallback({ amount, transactionUuid, merchantId, secretKey }) {
  const signedFieldNames = "transaction_uuid,total_amount,status,merchant_id";
  const payload = {
    transaction_uuid: transactionUuid,
    total_amount: String(amount),
    status: "COMPLETE",
    merchant_id: merchantId,
    provider: "pagseguro-pix-demo",
    signed_field_names: signedFieldNames,
  };
  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${payload[field]}`)
    .join(",");
  payload.signature = sign(message, secretKey);
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function buildPayload({ amount, transactionUuid, successPath }) {
  const { merchantId, secretKey, backendUrl } = getConfig();
  const totalAmount = normalizeAmount(amount, "Pix/PagSeguro payment");
  const data = buildSignedDemoCallback({
    amount: totalAmount,
    transactionUuid,
    merchantId,
    secretKey,
  });

  return {
    transactionUuid,
    actionUrl: `${backendUrl}${successPath}`,
    formFields: {
      data,
      provider: "pagseguro-pix-demo",
    },
  };
}

export function buildPagSeguroPixInitiationPayload({ amount, pickupId }) {
  return buildPayload({
    amount,
    transactionUuid: `PIX-PICKUP-${pickupId}-${randomUUID()}`,
    successPath: "/api/payments/pix/success",
  });
}

export function buildPagSeguroPixBillingPayload({ amount, billingId }) {
  return buildPayload({
    amount,
    transactionUuid: `PIX-BILL-${billingId}-${randomUUID()}`,
    successPath: "/api/billing/pix/success",
  });
}

export function decodeAndVerifyCallback(base64Data) {
  const { secretKey } = getConfig();

  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Missing Pix callback data");
  }

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(base64Data, "base64").toString("utf8"));
  } catch {
    throw new Error("Malformed Pix callback payload");
  }

  const signedFieldNames = parsed.signed_field_names;
  const providedSignature = parsed.signature;

  if (!signedFieldNames || !providedSignature) {
    throw new Error("Pix callback missing signature fields");
  }

  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${parsed[field]}`)
    .join(",");
  const expectedSignature = sign(message, secretKey);

  if (!safeCompareSignatures(expectedSignature, providedSignature)) {
    throw new Error("Pix callback signature mismatch");
  }

  return parsed;
}

export async function verifyTransactionStatus({ transactionUuid, totalAmount }) {
  const amount = normalizeAmount(totalAmount, "Pix/PagSeguro verification");
  return {
    status: "COMPLETE",
    total_amount: String(amount),
    ref_id: `PAGSEGURO-PIX-${String(transactionUuid).slice(-12).toUpperCase()}`,
    provider: "pagseguro-pix-demo",
  };
}
