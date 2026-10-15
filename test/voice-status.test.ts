import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { POST } from "@/app/api/voice/status/route";

const COMPANY = {
  id: "c1", name: "Demo", company_name: "Demo Plumbing",
  owner_phone: "+16045550199", twilio_number: "+16045550100",
  timezone: "America/Vancouver", active: true,
};

const LEAD = {
  id: "l1", company_id: "c1", caller_phone: "+16045551234",
  caller_name: null, address: null, issue: null, is_emergency: null,
  status: "collecting", summary: null, call_sid: "CA123",
  created_at: "", updated_at: "",
};

function makeReq(params: Record<string, string>) {
  return new Request("http://localhost/api/voice/status", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCompanyByTwilioNumber.mockResolvedValue(COMPANY);
  mocks.findLeadByCallSid.mockResolvedValue(null);
  mocks.createLeadForMissedCall.mockResolvedValue(LEAD);
  mocks.insertMessage.mockResolvedValue(undefined);
  mocks.sendSms.mockResolvedValue({ ok: true, sid: "MOCK_voice" });
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

describe("/api/voice/status", () => {
  it.each(["no-answer", "busy", "failed", "canceled"])(
    "missed call (%s) triggers a first recovery SMS",
    async (status) => {
      const res = await POST(
        makeReq({ From: "+16045551234", To: "+16045550100", CallSid: "CA123", DialCallStatus: status }) as any
      );
      expect(res.status).toBe(200);
      expect(mocks.createLeadForMissedCall).toHaveBeenCalledOnce();
      expect(mocks.sendSms).toHaveBeenCalledOnce();

      const arg = mocks.sendSms.mock.calls[0][0];
      expect(arg.to).toBe("+16045551234");          // texts the customer
      expect(arg.from).toBe("+16045550100");         // from the business number
      expect(arg.body.length).toBeLessThanOrEqual(280);
      expect(arg.body).not.toMatch(/\$|price|cost/i); // no prices
      expect(arg.body).not.toMatch(/available|on the way|arrive/i); // no availability/arrival
      expect(arg.body).not.toMatch(/will call|shortly/i); // no callback-timing promise

      expect(mocks.insertMessage).toHaveBeenCalledWith("l1", "outbound", expect.any(String), "MOCK_voice");
      expect(fetchSpy).not.toHaveBeenCalled();        // MOCK safety: no real network
    }
  );

  it("completed (answered) call does nothing", async () => {
    const res = await POST(
      makeReq({ From: "+16045551234", To: "+16045550100", CallSid: "CA999", DialCallStatus: "completed" }) as any
    );
    expect(res.status).toBe(200);
    expect(mocks.createLeadForMissedCall).not.toHaveBeenCalled();
    expect(mocks.sendSms).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("duplicate callback (same CallSid) does nothing", async () => {
    mocks.findLeadByCallSid.mockResolvedValue(LEAD); // lead already exists for this call
    const res = await POST(
      makeReq({ From: "+16045551234", To: "+16045550100", CallSid: "CA123", DialCallStatus: "no-answer" }) as any
    );
    expect(res.status).toBe(200);
    expect(mocks.createLeadForMissedCall).not.toHaveBeenCalled();
    expect(mocks.sendSms).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("unknown business number does nothing", async () => {
    mocks.getCompanyByTwilioNumber.mockResolvedValue(null);
    const res = await POST(
      makeReq({ From: "+16045551234", To: "+19999999999", CallSid: "CA777", DialCallStatus: "no-answer" }) as any
    );
    expect(res.status).toBe(200);
    expect(mocks.createLeadForMissedCall).not.toHaveBeenCalled();
    expect(mocks.sendSms).not.toHaveBeenCalled();
  });
});
