import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseTriage, runTriage } from "@/lib/groq";

describe("parseTriage (#2 strict parsing)", () => {
  it("parses clean JSON", () => {
    const r = parseTriage(
      '{"reply_to_customer":"Hi","collected":{"name":"Al","address":null,"issue":"clog","is_emergency":false},"complete":false}'
    );
    expect(r).not.toBeNull();
    expect(r!.reply_to_customer).toBe("Hi");
    expect(r!.collected.name).toBe("Al");
    expect(r!.collected.issue).toBe("clog");
    expect(r!.complete).toBe(false);
  });

  it("parses JSON wrapped in code fences", () => {
    const raw =
      '```json\n{"reply_to_customer":"Hi","collected":{"name":null,"address":null,"issue":null,"is_emergency":null},"complete":false}\n```';
    expect(parseTriage(raw)).not.toBeNull();
  });

  it("extracts JSON even with surrounding prose", () => {
    const raw =
      'Sure, here you go: {"reply_to_customer":"Ok","collected":{"name":null,"address":null,"issue":null,"is_emergency":null},"complete":false} hope that helps';
    const r = parseTriage(raw);
    expect(r).not.toBeNull();
    expect(r!.reply_to_customer).toBe("Ok");
  });

  it("caps reply_to_customer at 280 characters (#4)", () => {
    const long = "a".repeat(500);
    const r = parseTriage(`{"reply_to_customer":"${long}","collected":{},"complete":false}`);
    expect(r).not.toBeNull();
    expect(r!.reply_to_customer.length).toBe(280);
  });

  it("coerces bad collected fields to null and keeps booleans", () => {
    const r = parseTriage(
      '{"reply_to_customer":"Hi","collected":{"name":123,"address":"","issue":"leak","is_emergency":true},"complete":false}'
    );
    expect(r!.collected.name).toBeNull();     // number -> null
    expect(r!.collected.address).toBeNull();  // empty string -> null
    expect(r!.collected.issue).toBe("leak");
    expect(r!.collected.is_emergency).toBe(true);
  });

  it("treats non-true complete as false", () => {
    const r = parseTriage('{"reply_to_customer":"Hi","collected":{},"complete":"yes"}');
    expect(r!.complete).toBe(false);
  });

  it("returns null for malformed JSON", () => {
    expect(parseTriage("{ this is not json")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseTriage("")).toBeNull();
  });

  it("returns null when reply_to_customer is missing", () => {
    expect(parseTriage('{"collected":{},"complete":true}')).toBeNull();
  });
});

describe("runTriage fallback behavior (#3)", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const emptyCollected = { name: null, address: null, issue: null, is_emergency: null };

  it("falls back when there is no API key", async () => {
    delete process.env.GROQ_API_KEY;
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.complete).toBe(false);
    expect(r.collected).toEqual(emptyCollected);
    expect(r.reply_to_customer.length).toBeGreaterThan(0);
  });

  it("fallback reply promises no callback, availability, arrival, or price", async () => {
    delete process.env.GROQ_API_KEY;
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.reply_to_customer).not.toMatch(/will call|shortly/i);
    expect(r.reply_to_customer).not.toMatch(/available|on the way|arrive/i);
    expect(r.reply_to_customer).not.toMatch(/\$|price|cost/i);
  });

  it("falls back when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.complete).toBe(false);
    expect(r.collected).toEqual(emptyCollected);
  });

  it("falls back when content is unparseable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "not json at all" } }] }),
    })));
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.complete).toBe(false);
  });

  it("falls back when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.complete).toBe(false);
  });

  it("returns the parsed result on valid model output", async () => {
    const content = JSON.stringify({
      reply_to_customer: "Got it, what's the address?",
      collected: { name: "John", address: null, issue: "leak", is_emergency: false },
      complete: false,
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content } }] }),
    })));
    const r = await runTriage("Demo", [{ role: "user", content: "hi" }]);
    expect(r.collected.name).toBe("John");
    expect(r.collected.issue).toBe("leak");
    expect(r.reply_to_customer).toContain("address");
  });
});
