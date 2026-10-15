import { describe, it, expect, beforeEach, vi } from "vitest";

const h = vi.hoisted(() => ({ result: { data: null as unknown } }));

vi.mock("@/lib/supabase", () => {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve(h.result),
    single: () => Promise.resolve(h.result),
  };
  return { supabase: { from: () => chain } };
});

import { alreadyProcessed } from "@/lib/conversation";

describe("alreadyProcessed (duplicate MessageSid)", () => {
  beforeEach(() => {
    h.result = { data: null };
  });

  it("returns false when the sid is null (nothing to dedupe)", async () => {
    expect(await alreadyProcessed(null)).toBe(false);
  });

  it("returns false when no message with that sid exists", async () => {
    h.result = { data: null };
    expect(await alreadyProcessed("SM_new")).toBe(false);
  });

  it("returns true when a message with that sid already exists (duplicate)", async () => {
    h.result = { data: { id: "existing-row" } };
    expect(await alreadyProcessed("SM_dup")).toBe(true);
  });
});
