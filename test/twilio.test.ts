import { describe, it, expect, vi } from "vitest";
import { sendSms } from "@/lib/twilio";

describe("sendSms in MOCK mode", () => {
  it("returns ok with a MOCK sid and never hits the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const r = await sendSms({ to: "+16045551234", from: "+16045550100", body: "test" });

    expect(r.ok).toBe(true);
    expect(r.sid).toMatch(/^MOCK_/);
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
