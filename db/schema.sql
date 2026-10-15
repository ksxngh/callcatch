create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  owner_phone text not null,
  twilio_number text not null unique,
  timezone text not null default 'America/Vancouver',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$ begin
  create type lead_status as enum ('new','collecting','notified','closed');
exception when duplicate_object then null; end $$;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  caller_phone text not null,
  caller_name text, address text, issue text,
  is_emergency boolean,
  status lead_status not null default 'new',
  summary text,
  call_sid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_lookup on leads (company_id, caller_phone, status);

-- added for /api/voice/status missed-call dedup; safe to re-run on an existing DB
alter table leads add column if not exists call_sid text;
create unique index if not exists leads_call_sid on leads (call_sid) where call_sid is not null;

do $$ begin
  create type msg_direction as enum ('inbound','outbound');
exception when duplicate_object then null; end $$;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  direction msg_direction not null,
  body text not null,
  provider_sid text,
  created_at timestamptz not null default now()
);
create unique index if not exists messages_sid on messages (provider_sid) where provider_sid is not null;

-- seed one test company (mock numbers are fine for local testing)
insert into companies (name, company_name, owner_phone, twilio_number)
values ('Demo Plumbing', 'Demo Plumbing', '+16045550199', '+16045550100')
on conflict (twilio_number) do nothing;
