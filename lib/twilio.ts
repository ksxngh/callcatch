const MOCK = process.env.MOCK_TWILIO === "true";

export interface SendSmsArgs {
  to: string;
  from: string;
  body: string;
}

export async function sendSms({ to, from, body }: SendSmsArgs): Promise<{ ok: boolean; sid: string | null }> {
  const text = body.length > 1500 ? body.slice(0, 1500) : body;

  if (MOCK) {
    console.log(`\n[MOCK SMS] from=${from} to=${to}\n${text}\n`);
    return { ok: true, sid: `MOCK_${Date.now()}` };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.error("Twilio creds missing and MOCK_TWILIO is not true");
    return { ok: false, sid: null };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: text });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio send failed", data);
      return { ok: false, sid: null };
    }
    return { ok: true, sid: data.sid ?? null };
  } catch (e) {
    console.error("Twilio send error", e);
    return { ok: false, sid: null };
  }
}
