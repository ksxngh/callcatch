import crypto from "crypto";
import type { NextRequest } from "next/server";

// Twilio signs each webhook with HMAC-SHA1 over (full URL + POST params sorted
// by key, concatenated as key+value), keyed by the account auth token, then
// base64-encoded. We recompute it and compare against the X-Twilio-Signature
// header so only Twilio can create leads / trigger SMS.
// See: https://www.twilio.com/docs/usage/security#validating-requests

export function expectedSignature(
  authToken: string,
  url: string,
  params: Record<string, string>
): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

export function isValidSignature(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(expectedSignature(authToken, url, params));
  const provided = Buffer.from(signature);
  // timingSafeEqual throws on length mismatch, so guard first.
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

// The URL Twilio signs is the externally-visible one it requested. Behind a
// proxy/tunnel, req.url may differ, so honor forwarding headers and allow an
// explicit override.
function webhookUrl(req: NextRequest): string {
  const u = new URL(req.url);
  const base = process.env.TWILIO_WEBHOOK_BASE_URL;
  if (base) return base.replace(/\/+$/, "") + u.pathname + u.search;

  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) u.host = host;
  if (proto) u.protocol = `${proto}:`;
  return u.toString();
}

// Request-level guard for webhook routes. In MOCK mode validation is bypassed
// so local/test flows stay friendly. In real mode a missing or invalid
// signature returns false and the route must do nothing but 403.
export function verifyTwilioRequest(req: NextRequest, params: Record<string, string>): boolean {
  if (process.env.MOCK_TWILIO === "true") return true;

  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) {
    console.error("TWILIO_AUTH_TOKEN missing; rejecting unsigned webhook");
    return false;
  }

  const signature = req.headers.get("x-twilio-signature");
  return isValidSignature(token, signature, webhookUrl(req), params);
}

export const forbidden = () => new Response("Forbidden", { status: 403 });
