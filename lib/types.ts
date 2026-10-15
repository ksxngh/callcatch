export type LeadStatus = "new" | "collecting" | "notified" | "closed";

export interface Collected {
  name: string | null;
  address: string | null;
  issue: string | null;
  is_emergency: boolean | null;
}

// The exact shape the LLM must return every turn.
export interface TriageResult {
  reply_to_customer: string;
  collected: Collected;
  complete: boolean;
}

export interface Lead {
  id: string;
  company_id: string;
  caller_phone: string;
  caller_name: string | null;
  address: string | null;
  issue: string | null;
  is_emergency: boolean | null;
  status: LeadStatus;
  summary: string | null;
  call_sid: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  company_name: string;
  owner_phone: string;
  twilio_number: string;
  timezone: string;
  active: boolean;
}
