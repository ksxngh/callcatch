import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanyByTwilioNumber: vi.fn(),
  findOrCreateOpenLead: vi.fn(),
  alreadyProcessed: vi.fn(),
  insertMessage: vi.fn(),
  getHistory: vi.fn(),
  updateLead: vi.fn(),
  runTriage: vi.fn(),
  notifyOwner: vi.fn(),
  sendSms: vi.fn(),
}));

vi.mock("@/lib/conversation", () => ({
  getCompanyByTwilioNumber: mocks.getCompanyByTwilioNumber,
  findOrCreateOpenLead: mocks.findOrCreateOpenLead,
  alreadyProcessed: mocks.alreadyProcessed,
  insertMessage: mocks.insertMessage,
  getHistory: mocks.getHistory,
  updateLead: mocks.updateLead,
}));
vi.mock("@/lib/groq", () => ({ runTriage: mocks.runTriage }));
vi.mock("@/lib/notify", () => ({ notifyOwner: mocks.notifyOwner }));
vi.mock("@/lib/twilio", () => ({ sendSms: mocks.sendSms }));

import { POST } from "@/app/api/sms/incoming/route";

const COMPANY = {
  id: "c1", name: "Demo", company_name: "Demo Plumbing",
  owner_phone: "+16045550199", twilio_number: "+16045550100",
  timezone: "America/Vancouver", active: true,
};

const LEAD = {
  id: "l1", company_id: "c1", caller_phone: "+16045551234",
  caller_name: null, address: null, issue: null, is_emergency: null,
  status: "collecting", summary: null, call_sid: null,
  created_at: "", updated_at: "",
};

// Phrasing a customer-facing SMS must never contain.
const BANNED: Array<[RegExp, string]> = [
  [/will call/i, "callback promise"],
  [/shortly/i, "timing word"],
  [/\bavailable\b/i, "availability claim"],
  [/on (the|our) way|arriv(e|ing|al)|on (the|our) way/i, "arrival promise"],
  [/\bin \d+\s*(min|minute|hour|hr)/i, "arrival-time promise"],
  [/\$\d|\bprices?\b|\bcosts?\b|\bquote\b/i, "price quote"],
];
function assertCleanSms(body: string) {
  for (const [re, label] of BANNED) {
    expect(body, `${label} found in "${body}"`).not.toMatch(re);
  }
}

function makeReq(params: Record<string, string>) {
  return new Request("http://localhost/api/sms/incoming", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCompanyByTwilioNumber.mockResolvedValue(COMPANY);
  mocks.findOrCreateOpenLead.mockResolvedValue(LEAD);
  mocks.alreadyProcessed.mockResolvedValue(false);
  mocks.insertMessage.mockResolvedValue(undefined);
  mocks.getHistory.mockResolvedValue([]);
  mocks.updateLead.mockImplementation(async (_id, _c, isEmergency, status) => ({
    ...LEAD, is_emergency: isEmergency, status,
  }));
  mocks.notifyOwner.mockResolvedValue({ ok: true, sid: "MOCK_owner" });
  mocks.sendSms.mockResolvedValue({ ok: true, sid: "MOCK_reply" });
});

describe("/api/sms/incoming customer reply wording", () => {
  it("emergency: ignores unsafe model wording and sends the safe fixed reply", async () => {
    // Model tries to promise a callback time; the route must not forward it.
    mocks.runTriage.mockResolvedValue({
      reply_to_customer: "A plumber will call you back shortly and is available now.",
      collected: { name: null, address: null, issue: "flooding", is_emergency: true },
      complete: false,
    });

    const res = await POST(
      makeReq({ From: "+16045551234", To: "+16045550100", Body: "my basement is flooding, water everywhere", MessageSid: "SM1" }) as any
    );
    expect(res.status).toBe(200);

    const reply = mocks.sendSms.mock.calls[0][0];
    expect(reply.to).toBe("+16045551234");        // goes to the customer
    expect(reply.body.length).toBeLessThanOrEqual(280);
    assertCleanSms(reply.body);
    expect(reply.body).toMatch(/urgent/i);         // confirms the hand-off without promises

    // Owner notification behavior unchanged: still fired once for the emergency.
    expect(mocks.notifyOwner).toHaveBeenCalledOnce();
  });

  it("non-emergency: forwards the model reply and it is also free of banned phrasing", async () => {
    mocks.runTriage.mockResolvedValue({
      reply_to_customer: "Thanks Jordan. What's the service address so we can pass this to the plumber?",
      collected: { name: "Jordan", address: null, issue: "clogged sink", is_emergency: false },
      complete: false,
    });

    const res = await POST(
      makeReq({ From: "+16045551234", To: "+16045550100", Body: "my kitchen sink is clogged", MessageSid: "SM2" }) as any
    );
    expect(res.status).toBe(200);

    const reply = mocks.sendSms.mock.calls[0][0];
    expect(reply.body.length).toBeLessThanOrEqual(280);
    assertCleanSms(reply.body);
    expect(mocks.notifyOwner).not.toHaveBeenCalled(); // not complete, not emergency
  });
});
