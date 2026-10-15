import { sendSms } from "./twilio";
import type { Company, Lead } from "./types";

export function buildOwnerSummary(lead: Lead): string {
  const tag = lead.is_emergency ? "NEW LEAD - EMERGENCY" : "NEW LEAD";
  return [
    tag,
    `Call back: ${lead.caller_phone}`,
    `Name: ${lead.caller_name ?? "(not given yet)"}`,
    `Address: ${lead.address ?? "(not given yet)"}`,
    `Issue: ${lead.issue ?? "(not given yet)"}`,
  ].join("\n");
}

export async function notifyOwner(company: Company, lead: Lead) {
  return sendSms({ to: company.owner_phone, from: company.twilio_number, body: buildOwnerSummary(lead) });
}
