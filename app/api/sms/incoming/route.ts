import { NextRequest } from "next/server";
import { runTriage } from "@/lib/groq";
import { isEmergency } from "@/lib/emergency";
import { notifyOwner } from "@/lib/notify";
import { sendSms } from "@/lib/twilio";
import { verifyTwilioRequest, forbidden } from "@/lib/twilioSignature";
import {
  getCompanyByTwilioNumber, findOrCreateOpenLead, alreadyProcessed,
  insertMessage, getHistory, updateLead,
} from "@/lib/conversation";

export const runtime = "nodejs";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const twiml = () => new Response(EMPTY_TWIML, { status: 200, headers: { "Content-Type": "text/xml" } });

// For emergencies we don't trust the model's wording. Send a fixed reply that
// confirms the urgent hand-off without promising a callback, a callback time,
// availability, an arrival time, or a price. Stays well under 280 chars.
const EMERGENCY_REPLY =
  "We've passed this along as urgent. Please keep your phone nearby.";

export async function POST(req: NextRequest) {
  const form = await req.formData(); // Twilio posts x-www-form-urlencoded

  // Reject anything not signed by Twilio before doing any work.
  const params: Record<string, string> = {};
  form.forEach((value, key) => { params[key] = String(value); });
  if (!verifyTwilioRequest(req, params)) return forbidden();

  const from = String(form.get("From") ?? "");
  const to = String(form.get("To") ?? "");
  const body = String(form.get("Body") ?? "").trim();
  const messageSid = form.get("MessageSid") ? String(form.get("MessageSid")) : null;

  if (!from || !to || !body) return twiml();

  const company = await getCompanyByTwilioNumber(to);
  if (!company) { console.warn(`No active company for ${to}`); return twiml(); }

  if (await alreadyProcessed(messageSid)) return twiml(); // Twilio retries

  const lead = await findOrCreateOpenLead(company.id, from);
  if (!lead) return twiml();

  await insertMessage(lead.id, "inbound", body, messageSid);

  const history = await getHistory(lead.id);
  const triage = await runTriage(company.company_name, history);

  const emergency = isEmergency(body, triage.collected.is_emergency) || lead.is_emergency === true;

  // Emergency -> notify now even if incomplete. Otherwise notify when intake completes.
  const shouldNotify = lead.status !== "notified" && (emergency || triage.complete);
  const updated = await updateLead(lead.id, triage.collected, emergency, shouldNotify ? "notified" : "collecting");
  const finalLead = updated ?? { ...lead, is_emergency: emergency };

  if (shouldNotify) await notifyOwner(company, finalLead);

  // Emergencies get the safe fixed reply; otherwise use the triage reply. Hard 280 cap.
  const reply = (emergency ? EMERGENCY_REPLY : triage.reply_to_customer).slice(0, 280);
  const sent = await sendSms({ to: from, from: company.twilio_number, body: reply });
  await insertMessage(lead.id, "outbound", reply, sent.sid);

  return twiml();
}
