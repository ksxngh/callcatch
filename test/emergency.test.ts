import { describe, it, expect } from "vitest";
import { detectEmergencyFromText, isEmergency } from "@/lib/emergency";

describe("detectEmergencyFromText", () => {
  it.each([
    "my basement is flooding",
    "the pipe burst",
    "sewage is backing up",
    "we have no hot water",
    "the toilet is overflowing",
    "I smell gas in the kitchen",
    "this is an emergency please hurry",
  ])("flags emergency: %s", (text) => {
    expect(detectEmergencyFromText(text)).toBe(true);
  });

  it.each([
    "my kitchen faucet drips a little",
    "I'd like a quote for a new sink install",
    "can someone look at the slow drain next week",
  ])("does not flag: %s", (text) => {
    expect(detectEmergencyFromText(text)).toBe(false);
  });

  it("is case insensitive", () => {
    expect(detectEmergencyFromText("BASEMENT IS FLOODING")).toBe(true);
  });
});

describe("isEmergency (keyword + model combination)", () => {
  it("keyword triggers even if the LLM says false (#6)", () => {
    expect(isEmergency("basement is flooding", false)).toBe(true);
  });

  it("LLM true triggers even with no keyword present (#7)", () => {
    expect(isEmergency("the toilet won't flush at all", true)).toBe(true);
  });

  it("non-emergency: no keyword and LLM false (#8)", () => {
    expect(isEmergency("kitchen faucet drips a little", false)).toBe(false);
  });

  it("non-emergency: no keyword and LLM null", () => {
    expect(isEmergency("slow drain in the bathroom", null)).toBe(false);
  });
});
