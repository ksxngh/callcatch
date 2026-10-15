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

// Twilio's "A call comes in" webhook, used with carrier call-forwarding:
// the customer calls the plumber's real number, and when the plumber doesn't
// answer, the carrier forwards the call here. So a call reaching this endpoint
// IS a missed call — we text the caller back immediately, then hang up. No
// dialing (the plumber already missed it) and no voice bot.

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });

// Spoken while we fire the text; keep it short and honest.
const SAY =
  "<Response><Say>Sorry we missed your call. We are texting you right now so we can help. Thanks.</Say><Hangup/></Response>";
const HANGUP =
  "<Response><Say>Sorry, no one is available right now. Please send us a text.</Say><Hangup/></Response>";

function firstRecoverySms(companyName: string): string {
  const msg = `Sorry we missed your call. This is the text line for ${companyName}. Tell us your name, the address, and what's happening with the plumbing, and someone will follow up.`;
  return msg.slice(0, 280);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const params: Record<string, string> = {};
  form.forEach((value, key) => { params[key] = String(value); });
  if (!verifyTwilioRequest(req, params)) return forbidden();

  const caller = String(form.get("From") ?? "");        // the customer who called
  const businessNumber = String(form.get("To") ?? "");  // the Twilio number the call landed on
  const callSid = form.get("CallSid") ? String(form.get("CallSid")) : null;

  if (!caller || !businessNumber) return xml(HANGUP);

  const company = await getCompanyByTwilioNumber(businessNumber);
  if (!company) { console.warn(`No active company for ${businessNumber}`); return xml(HANGUP); }

  // Duplicate protection: Twilio retries webhooks, keyed on the inbound CallSid.
  if (callSid && (await findLeadByCallSid(callSid))) return xml(SAY);

  const lead = await createLeadForMissedCall(company.id, caller, callSid);
  if (!lead) return xml(SAY); // creation lost a race with a retry; never double-text

  const body = firstRecoverySms(company.company_name);
  const sent = await sendSms({ to: caller, from: company.twilio_number, body });
  await insertMessage(lead.id, "outbound", body, sent.sid);

  return xml(SAY);
}
