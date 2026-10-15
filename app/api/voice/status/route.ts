import type { NextRequest } from "next/server";
import { sendSms } from "@/lib/twilio";
import { verifyTwilioRequest, forbidden } from "@/lib/twilioSignature";
import {
  getCompanyByTwilioNumber,
  findLeadByCallSid,
  createLeadForMissedCall,
  insertMessage,
} from "@/lib/conversation";

export const runtime = "nodejs";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const ok = () => new Response(EMPTY_TWIML, { status: 200, headers: { "Content-Type": "text/xml" } });

// A dialed-leg result that means the plumber did not pick up.
const MISSED = new Set(["no-answer", "busy", "failed", "canceled"]);

// Fixed, instant first contact. No LLM here: speed matters and there is nothing to triage yet.
// No price, no arrival time, no availability claim. Stays well under 280 chars.
function firstRecoverySms(companyName: string): string {
  const msg = `Sorry we missed your call. This is the text line for ${companyName}. Tell us your name, the address, and what's happening with the plumbing, and we'll call you right back.`;
  return msg.slice(0, 280);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Reject anything not signed by Twilio before doing any work.
  const params: Record<string, string> = {};
  form.forEach((value, key) => { params[key] = String(value); });
  if (!verifyTwilioRequest(req, params)) return forbidden();

  const caller = String(form.get("From") ?? "");          // original caller (customer)
  const businessNumber = String(form.get("To") ?? "");    // the Twilio number that took the call
  const callSid = form.get("CallSid") ? String(form.get("CallSid")) : null;

  // <Dial> action callbacks report the dialed leg via DialCallStatus.
  // Fall back to CallStatus for plain status callbacks.
  const status = String(form.get("DialCallStatus") ?? form.get("CallStatus") ?? "").toLowerCase();

  // Only act on missed calls. Answered/completed calls do nothing.
  if (!MISSED.has(status)) return ok();
  if (!caller || !businessNumber) return ok();

  const company = await getCompanyByTwilioNumber(businessNumber);
  if (!company) { console.warn(`No active company for ${businessNumber}`); return ok(); }

  // Duplicate protection: Twilio retries status callbacks.
  if (callSid && (await findLeadByCallSid(callSid))) return ok();

  const lead = await createLeadForMissedCall(company.id, caller, callSid);
  if (!lead) return ok(); // creation failed or lost a race with a retry; never double-text

  // First recovery SMS, logged as an outbound message so the conversation history
  // already contains the opener when the customer replies into /api/sms/incoming.
  const body = firstRecoverySms(company.company_name);
  const sent = await sendSms({ to: caller, from: company.twilio_number, body });
  await insertMessage(lead.id, "outbound", body, sent.sid);

  return ok();
}
