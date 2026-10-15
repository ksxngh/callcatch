import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanyByTwilioNumber: vi.fn(),
  findLeadByCallSid: vi.fn(),
  createLeadForMissedCall: vi.fn(),
  insertMessage: vi.fn(),
  sendSms: vi.fn(),
}));

vi.mock("@/lib/conversation", () => ({
  getCompanyByTwilioNumber: mocks.getCompanyByTwilioNumber,
  findLeadByCallSid: mocks.findLeadByCallSid,
  createLeadForMissedCall: mocks.createLeadForMissedCall,
  insertMessage: mocks.insertMessage,
}));

vi.mock("@/lib/twilio", () => ({ sendSms: mocks.sendSms }));

import { expectedSignature, isValidSignature } from "@/lib/twilioSignature";
import { POST } from "@/app/api/voice/status/route";

describe("twilio signature algorithm", () => {
  // Canonical vector from Twilio's request-validation docs (auth token "12345").
  const TOKEN = "12345";
  const URL = "https://mycompany.com/myapp.php?foo=1&bar=2";
  const PARAMS = {
    CallSid: "CA1234567890ABCDE",
    Caller: "+14158675309",
    Digits: "1234",
    From: "+14158675309",
    To: "+18005551212",
  };
  const VALID = "RSOYDt4T1cUTdK1PDd93/VVr8B8=";

  it("computes the documented signature", () => {
    expect(expectedSignature(TOKEN, URL, PARAMS)).toBe(VALID);
  });

  it("accepts a valid signature", () => {
    expect(isValidSignature(TOKEN, VALID, URL, PARAMS)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(isValidSignature(TOKEN, "AAAAAAAAAAAAAAAAAAAAAAAAAAA=", URL, PARAMS)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(isValidSignature(TOKEN, null, URL, PARAMS)).toBe(false);
  });

  it("rejects when any param is altered", () => {
    expect(isValidSignature(TOKEN, VALID, URL, { ...PARAMS, Digits: "9999" })).toBe(false);
  });
});

describe("/api/voice/status signature enforcement (non-mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MOCK_TWILIO", "false");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");
    vi.stubEnv("TWILIO_WEBHOOK_BASE_URL", "http://localhost");
    mocks.getCompanyByTwilioNumber.mockResolvedValue({ id: "c1", company_name: "Demo", twilio_number: "+16045550100" });
    mocks.findLeadByCallSid.mockResolvedValue(null);
    mocks.createLeadForMissedCall.mockResolvedValue({ id: "l1" });
    mocks.sendSms.mockResolvedValue({ ok: true, sid: "MOCK" });
  });

  afterEach(() => vi.unstubAllEnvs());

  const params = { From: "+16045551234", To: "+16045550100", CallSid: "CA123", DialCallStatus: "no-answer" };

  function makeReq(signature: string | null) {
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (signature !== null) headers["X-Twilio-Signature"] = signature;
    return new Request("http://localhost/api/voice/status", {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString(),
    });
  }

  it("accepts a correctly signed request", async () => {
    const sig = expectedSignature("test-token", "http://localhost/api/voice/status", params);
    const res = await POST(makeReq(sig) as any);
    expect(res.status).toBe(200);
    expect(mocks.createLeadForMissedCall).toHaveBeenCalledOnce();
    expect(mocks.sendSms).toHaveBeenCalledOnce();
  });

  it("returns 403 and does nothing for an invalid signature", async () => {
    const res = await POST(makeReq("not-a-valid-signature") as any);
    expect(res.status).toBe(403);
    expect(mocks.createLeadForMissedCall).not.toHaveBeenCalled();
    expect(mocks.sendSms).not.toHaveBeenCalled();
  });

  it("returns 403 and does nothing when the signature is missing", async () => {
    const res = await POST(makeReq(null) as any);
    expect(res.status).toBe(403);
    expect(mocks.createLeadForMissedCall).not.toHaveBeenCalled();
    expect(mocks.sendSms).not.toHaveBeenCalled();
  });
});
