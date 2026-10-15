import { supabase } from "./supabase";
import type { Company, Lead, Collected, LeadStatus } from "./types";
import type { ChatTurn } from "./groq";

export async function getCompanyByTwilioNumber(twilioNumber: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies").select("*")
    .eq("twilio_number", twilioNumber).eq("active", true)
    .maybeSingle();
  if (error) { console.error("getCompany", error); return null; }
  return data as Company | null;
}

// Find the open lead for this caller, or create one. Lets the route work standalone
// in testing even though the voice handler normally creates the lead first.
export async function findOrCreateOpenLead(companyId: string, callerPhone: string): Promise<Lead | null> {
  const { data: existing, error: findErr } = await supabase
    .from("leads").select("*")
    .eq("company_id", companyId).eq("caller_phone", callerPhone)
    .in("status", ["new", "collecting"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (findErr) { console.error("findLead", findErr); return null; }
  if (existing) return existing as Lead;

  const { data: created, error: createErr } = await supabase
    .from("leads")
    .insert({ company_id: companyId, caller_phone: callerPhone, status: "collecting" })
    .select("*").single();
  if (createErr) { console.error("createLead", createErr); return null; }
  return created as Lead;
}

export async function alreadyProcessed(messageSid: string | null): Promise<boolean> {
  if (!messageSid) return false;
  const { data } = await supabase.from("messages").select("id").eq("provider_sid", messageSid).maybeSingle();
  return !!data;
}

export async function insertMessage(leadId: string, direction: "inbound" | "outbound", body: string, providerSid: string | null) {
  const { error } = await supabase.from("messages").insert({ lead_id: leadId, direction, body, provider_sid: providerSid });
  if (error) console.error("insertMessage", error);
}

export async function getHistory(leadId: string): Promise<ChatTurn[]> {
  const { data, error } = await supabase
    .from("messages").select("direction, body")
    .eq("lead_id", leadId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((m) => ({ role: m.direction === "inbound" ? "user" : "assistant", content: m.body }));
}

// Only overwrite a field when the new value is non-null, so earlier info is never lost.
export async function updateLead(
  leadId: string, collected: Collected, isEmergency: boolean, status?: LeadStatus
): Promise<Lead | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), is_emergency: isEmergency };
  if (collected.name) patch.caller_name = collected.name;
  if (collected.address) patch.address = collected.address;
  if (collected.issue) patch.issue = collected.issue;
  if (status) patch.status = status;

  const { data, error } = await supabase.from("leads").update(patch).eq("id", leadId).select("*").single();
  if (error) { console.error("updateLead", error); return null; }
  return data as Lead;
}

// --- missed-call (voice status) helpers ---

// Duplicate protection for Twilio status-callback retries, keyed on the inbound CallSid.
export async function findLeadByCallSid(callSid: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads").select("*").eq("call_sid", callSid).maybeSingle();
  if (error) { console.error("findLeadByCallSid", error); return null; }
  return (data as Lead) ?? null;
}

// Creates the lead the moment a call is missed, before any customer text arrives.
// status 'collecting' so the SMS route picks it up when the customer replies.
export async function createLeadForMissedCall(
  companyId: string, callerPhone: string, callSid: string | null
): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .insert({ company_id: companyId, caller_phone: callerPhone, call_sid: callSid, status: "collecting" })
    .select("*").single();
  if (error) { console.error("createLeadForMissedCall", error); return null; }
  return data as Lead;
}
