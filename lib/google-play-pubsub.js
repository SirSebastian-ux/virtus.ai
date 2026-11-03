import { createPublicKey, verify as verifySignature } from "node:crypto";

let cache = { expiresAt: 0, keys: [] };

function decodeJwt(token) {
  if (typeof token !== "string" || token.length > 10000) throw new Error("Invalid Pub/Sub token.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Pub/Sub JWT structure.");
  const read = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  return {
    header: read(parts[0]),
    payload: read(parts[1]),
    signed: Buffer.from(parts[0] + "." + parts[1]),
    signature: Buffer.from(parts[2], "base64url"),
  };
}

export async function verifyGooglePubSubPushAuth(authorization) {
  const audience = process.env.GOOGLE_PLAY_PUBSUB_PUSH_AUDIENCE;
  const expectedEmail = process.env.GOOGLE_PLAY_PUBSUB_PUSH_SERVICE_ACCOUNT;
  if (!audience || !expectedEmail) throw new Error("Pub/Sub push authentication is not configured.");
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    throw new Error("Pub/Sub push Authorization header missing.");
  }

  const jwt = decodeJwt(authorization.slice(7));
  const now = Math.floor(Date.now() / 1000);
  if (jwt.header.alg !== "RS256" || typeof jwt.header.kid !== "string" ||
      !["https://accounts.google.com", "accounts.google.com"].includes(jwt.payload.iss) ||
      jwt.payload.aud !== audience ||
      jwt.payload.email !== expectedEmail ||
      jwt.payload.email_verified !== true ||
      !Number.isInteger(jwt.payload.exp) || jwt.payload.exp <= now ||
      !Number.isInteger(jwt.payload.iat) || jwt.payload.iat > now + 60 ||
      jwt.payload.iat < now - 7200) {
    throw new Error("Pub/Sub push token claims rejected.");
  }

  if (cache.expiresAt < Date.now() || !cache.keys.some(k => k.kid === jwt.header.kid)) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Google public signing keys unavailable.");
    const certs = await response.json();
    if (!Array.isArray(certs.keys)) throw new Error("Invalid Google signing key response.");
    cache = { keys: certs.keys, expiresAt: Date.now() + 10 * 60 * 1000 };
  }
  const jwk = cache.keys.find(k => k.kid === jwt.header.kid && k.kty === "RSA");
  if (!jwk) throw new Error("Unrecognized Google signing key.");
  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  if (!verifySignature("RSA-SHA256", jwt.signed, publicKey, jwt.signature)) {
    throw new Error("Pub/Sub push signature invalid.");
  }
  return jwt.payload;
}

export function decodePlayRtdnData(encoded) {
  if (typeof encoded !== "string" || encoded.length < 8 || encoded.length > 10000 ||
      !/^[a-zA-Z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error("Invalid RTDN payload.");
  }
  const data = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (!data || data.packageName !== "com.virtusaiworld.app") {
    throw new Error("RTDN package mismatch.");
  }
  const token = data.subscriptionNotification?.purchaseToken;
  if (!data.testNotification && (typeof token !== "string" || token.length < 8 || token.length > 2048)) {
    throw new Error("Unsupported RTDN type.");
  }
  return { test: Boolean(data.testNotification), purchaseToken: token || null };
}
