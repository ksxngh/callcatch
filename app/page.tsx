"use client";

import { useEffect } from "react";

const CSS = `
  html,body{margin:0;padding:0;background:#fdfcfc;}
  .cc{
    --eggshell:#fdfcfc; --taupe:#f5f3f1; --stone:#ebe8e4;
    --ink:#000000; --graphite:#44403b; --smoke:#777169; --ash:#a59f97;
    --btn-border:#e5e5e5;
    --fdisp:'Inter',ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --fbody:'Inter',ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --fmono:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
    background:var(--eggshell); color:var(--ink); font-family:var(--fbody);
    font-size:16px; line-height:1.5; letter-spacing:.16px; -webkit-font-smoothing:antialiased;
  }
  .cc *{box-sizing:border-box;}
  .cc .wrap{max-width:1280px;margin:0 auto;padding:0 64px;}
  @media(max-width:820px){.cc .wrap{padding:0 24px;}}
  .cc .disp{font-family:var(--fdisp);font-weight:300;letter-spacing:-.02em;color:var(--ink);text-wrap:balance;margin:0;}
  .cc .d48{font-size:48px;line-height:1.08;}
  .cc .d36{font-size:36px;line-height:1.17;}
  .cc .d32{font-size:32px;line-height:1.13;}
  @media(max-width:720px){.cc .d48{font-size:36px;}.cc .d36{font-size:32px;}}
  .cc .mono{font-family:var(--fmono);font-size:13px;line-height:1.69;color:var(--smoke);}
  .cc .cap{font-size:10px;line-height:1.6;color:var(--ash);text-transform:uppercase;letter-spacing:.1em;margin:0;}
  .cc .body{font-size:16px;line-height:1.5;letter-spacing:.16px;color:var(--smoke);margin:0;}
  .cc .bodylg{font-size:20px;line-height:1.35;color:var(--smoke);margin:0;}
  .cc .nav{height:50px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px;}
  .cc .word{font-size:16px;font-weight:500;letter-spacing:-.01em;color:var(--ink);}
  .cc .navb{display:flex;gap:8px;}
  .cc .pill{display:inline-flex;align-items:center;justify-content:center;font-family:var(--fbody);
    font-size:14px;font-weight:500;letter-spacing:.14px;border-radius:9999px;text-decoration:none;
    height:40px;border:1px solid var(--btn-border);transition:opacity .15s ease;}
  .cc .pfill{background:var(--ink);color:var(--eggshell);padding:0 16px;}
  .cc .pfill:hover{opacity:.85;}
  .cc .pout{background:var(--eggshell);color:var(--ink);padding:0 14px;}
  .cc .pout:hover{background:var(--taupe);}
  .cc .pill:focus-visible{outline:2px solid var(--ink);outline-offset:2px;}
  .cc .hero{display:grid;grid-template-columns:1.02fr .98fr;gap:64px;align-items:center;padding:96px 0 104px;}
  @media(max-width:960px){.cc .hero{grid-template-columns:1fr;gap:56px;padding:64px 0 72px;}}
  .cc .hero-cta{display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;}
  .cc .vline{margin-top:28px;font-size:18px;line-height:1.6;color:var(--smoke);}
  .cc .vline a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--stone);padding-bottom:1px;font-weight:500;}
  .cc .vline a:hover{border-bottom-color:var(--ink);}
  .cc .stage{position:relative;display:flex;justify-content:center;}
  .cc .sphere{position:absolute;width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle at 32% 30%, #ff4704 0%, rgba(255,71,4,.55) 22%,
      rgba(236,72,153,.42) 46%, rgba(4,71,255,.55) 72%, rgba(4,71,255,0) 100%);
    filter:blur(26px);opacity:.5;top:-34px;right:-18px;pointer-events:none;}
  @media(max-width:960px){.cc .sphere{right:auto;left:-30px;}}
  .cc .phone{position:relative;background:var(--eggshell);border-radius:24px;
    box-shadow:rgba(0,0,0,.4) 0 0 1px 0, rgba(0,0,0,.04) 0 1px 1px 0, rgba(0,0,0,.04) 0 2px 4px 0;
    width:100%;max-width:360px;overflow:hidden;}
  .cc .ph-head{display:flex;align-items:center;gap:12px;padding:20px 20px 16px;border-bottom:1px solid var(--stone);}
  .cc .plate{width:38px;height:38px;border-radius:9999px;background:var(--stone);display:grid;place-items:center;
    font-size:12px;font-weight:500;color:var(--graphite);flex:none;}
  .cc .ph-n{font-size:15px;font-weight:500;line-height:1.3;color:var(--ink);}
  .cc .thread{padding:18px 16px 22px;display:flex;flex-direction:column;gap:10px;min-height:330px;}
  .cc .sysline{align-self:center;font-family:var(--fmono);font-size:13px;color:var(--ash);}
  .cc .bub{max-width:85%;padding:11px 15px;font-size:15px;line-height:1.47;letter-spacing:.15px;border-radius:16px;}
  .cc .bin{align-self:flex-start;background:var(--taupe);color:var(--graphite);border-bottom-left-radius:6px;}
  .cc .bout{align-self:flex-end;background:var(--ink);color:var(--eggshell);border-bottom-right-radius:6px;}
  .cc .sent{align-self:flex-start;font-family:var(--fmono);font-size:13px;color:var(--ash);margin-top:-5px;}
  .cc .rv{opacity:0;transform:translateY(6px);transition:opacity .36s ease,transform .36s ease;}
  .cc .rv.on{opacity:1;transform:none;}
  @media(prefers-reduced-motion:reduce){.cc .rv{opacity:1;transform:none;transition:none;}}
  .cc .band{background:var(--taupe);}
  .cc .beats{display:grid;grid-template-columns:repeat(4,1fr);gap:48px;padding:96px 0;}
  @media(max-width:900px){.cc .beats{grid-template-columns:1fr 1fr;gap:40px;padding:72px 0;}}
  @media(max-width:560px){.cc .beats{grid-template-columns:1fr;}}
  .cc .tval{font-family:var(--fmono);font-size:20px;color:var(--graphite);font-variant-numeric:tabular-nums;}
  .cc .beat h3{font-size:18px;line-height:1.6;font-weight:500;color:var(--ink);margin:14px 0 6px;}
  .cc .beat p{font-size:15px;line-height:1.5;color:var(--smoke);margin:0;}
  .cc section{padding:112px 0;}
  @media(max-width:820px){.cc section{padding:80px 0;}}
  .cc .split{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;}
  @media(max-width:900px){.cc .split{grid-template-columns:1fr;gap:44px;}}
  .cc .lede{margin-top:20px;max-width:52ch;}
  .cc .facts{list-style:none;padding:0;margin:0;}
  .cc .facts li{padding:20px 0;border-top:1px solid var(--stone);font-size:16px;line-height:1.5;color:var(--smoke);}
  .cc .facts li:last-child{border-bottom:1px solid var(--stone);}
  .cc .facts b{color:var(--ink);font-weight:500;}
  .cc .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px;}
  .cc .tag{border:1px solid var(--stone);border-radius:9999px;padding:7px 14px;font-size:13px;color:var(--graphite);background:var(--eggshell);}
  .cc .tscroll{overflow-x:auto;margin-top:40px;}
  .cc table{border-collapse:collapse;width:100%;min-width:620px;}
  .cc th,.cc td{text-align:left;padding:18px 20px 18px 0;border-bottom:1px solid var(--stone);}
  .cc th{font-family:var(--fmono);font-size:13px;font-weight:400;color:var(--ash);text-transform:uppercase;
    letter-spacing:.06em;border-bottom-color:var(--graphite);}
  .cc td{font-size:16px;color:var(--graphite);}
  .cc td.num{font-variant-numeric:tabular-nums;font-family:var(--fmono);font-size:15px;}
  .cc td.gain{color:var(--ink);font-weight:500;}
  .cc tr td:first-child{color:var(--ink);}
  .cc .fnote{margin-top:24px;max-width:64ch;}
  .cc .loss{background:var(--taupe);border-radius:20px;padding:32px;margin-top:40px;max-width:600px;}
  .cc .loss .big{font-family:var(--fdisp);font-weight:300;font-size:32px;line-height:1.13;letter-spacing:-.64px;color:var(--ink);margin:10px 0 0;}
  .cc .card{background:var(--taupe);border-radius:20px;padding:32px;max-width:560px;}
  .cc .amt{display:flex;align-items:baseline;gap:10px;margin:18px 0 6px;}
  .cc .amt b{font-family:var(--fdisp);font-weight:300;font-size:48px;line-height:1.08;letter-spacing:-.96px;
    color:var(--ink);font-variant-numeric:tabular-nums;}
  .cc .amt span{font-family:var(--fmono);font-size:13px;color:var(--ash);}
  .cc .addon{background:var(--eggshell);border:1px solid var(--stone);border-radius:20px;padding:32px;max-width:560px;margin-top:20px;}
  .cc .bignum{display:inline-block;margin-top:12px;font-family:var(--fdisp);font-weight:300;font-size:48px;
    line-height:1.08;letter-spacing:-.96px;color:var(--ink);text-decoration:none;font-variant-numeric:tabular-nums;
    border-bottom:1px solid var(--stone);padding-bottom:4px;}
  .cc .bignum:hover{border-bottom-color:var(--ink);}
  @media(max-width:720px){.cc .bignum{font-size:36px;letter-spacing:-.72px;}}
  .cc .rule{height:1px;background:var(--stone);border:0;margin:0;}
  .cc .foot{padding:40px 0 48px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;}
`;

const MARKUP = `
<div class="wrap">
  <nav class="nav">
    <div class="word">CallCatch</div>
    <div class="navb">
      <a class="pill pout" href="#math">See the math</a>
      <a class="pill pfill" href="#get">Get set up</a>
    </div>
  </nav>

  <div class="hero">
    <div>
      <p class="cap">For plumbers, trades &amp; front desks</p>
      <h1 class="disp d48" style="margin-top:20px;">Every missed call is a job for someone else.</h1>
      <p class="bodylg" style="margin-top:24px;max-width:50ch;">You're under a sink. The phone rings. By the time you call back, they've booked the next name on the list. CallCatch texts them back in five seconds.</p>
      <div class="hero-cta">
        <a class="pill pfill" href="#get">Text or call — free setup</a>
        <a class="pill pout" href="#how">See how it works</a>
      </div>
      <p class="vline">Rather it answer out loud than text? <a href="#voice">We set up voice agents too</a></p>
    </div>
    <div class="stage">
      <div class="sphere" aria-hidden="true"></div>
      <div class="phone" aria-label="Text conversation after a missed call">
        <div class="ph-head">
          <div class="plate">MP</div>
          <div>
            <div class="ph-n">Mike's Plumbing</div>
            <div class="mono" style="font-size:13px;line-height:1.3;">Text line</div>
          </div>
        </div>
        <div class="thread" id="thread">
          <div class="sysline rv">Missed call · 2:14 pm</div>
          <div class="bub bin rv">Sorry we missed your call. This is the text line for Mike's Plumbing. Tell us your name, the address, and what's happening.</div>
          <div class="sent rv">Sent 5 seconds later</div>
          <div class="bub bout rv">It's Sarah — kitchen sink is backed up, water all over the floor</div>
          <div class="bub bin rv">Got it Sarah. What's the service address?</div>
          <div class="bub bout rv">412 Oak Street</div>
          <div class="bub bin rv">Flagged as urgent and sent straight to Mike. Keep your phone close.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="band">
  <div class="wrap">
    <div class="beats">
      <div class="beat"><div class="tval">0:00</div><h3>The call is missed</h3><p>You're on a job, driving, or it's nine on a Sunday night.</p></div>
      <div class="beat"><div class="tval">0:05</div><h3>They get a text</h3><p>Before they dial the next name on the list.</p></div>
      <div class="beat"><div class="tval">0:48</div><h3>They describe the problem</h3><p>Name, address, what's wrong — collected automatically.</p></div>
      <div class="beat"><div class="tval">1:20</div><h3>The lead reaches you</h3><p>Flooding or a burst pipe is flagged urgent and pushed first.</p></div>
    </div>
  </div>
</div>

<div class="wrap">
  <section id="how">
    <div class="split">
      <div>
        <p class="cap">How it fits</p>
        <h2 class="disp d36" style="margin-top:18px;">It runs on the number you already have.</h2>
        <p class="body lede">No new phone, no app, no software to learn. You forward your line once — that is the entire setup, and it takes about twenty seconds on your handset.</p>
        <div class="tags">
          <span class="tag">Plumbing</span><span class="tag">HVAC</span><span class="tag">Electrical</span>
          <span class="tag">Drainage</span><span class="tag">Dental front desk</span>
        </div>
      </div>
      <ul class="facts">
        <li><b>Keeps your business number.</b> Customers never see a different one.</li>
        <li><b>Nothing to install.</b> No app, no dashboard to check each morning.</li>
        <li><b>Works after hours.</b> Nights and weekends are when most jobs are lost.</li>
        <li><b>Emergencies come first.</b> Flooding, burst pipes and no water get flagged and pushed to you.</li>
        <li><b>Never quotes a price.</b> And never promises an arrival time. That stays your call.</li>
      </ul>
    </div>
  </section>

  <hr class="rule" />

  <section id="math">
    <p class="cap">The math</p>
    <h2 class="disp d36" style="margin-top:18px;">One recovered job pays for the month.</h2>
    <p class="body lede">CallCatch is $249 a month, flat, however many calls it catches. Below is what that means against a typical job in your trade. Swap in your own average ticket — the arithmetic doesn't change.</p>
    <div class="tscroll">
      <table>
        <thead><tr><th>Trade</th><th>Typical job</th><th>Jobs to break even</th><th>Net, recovering 4 a month</th></tr></thead>
        <tbody>
          <tr><td>Plumbing</td><td class="num">$350</td><td class="num">0.7</td><td class="num gain">+$1,151</td></tr>
          <tr><td>HVAC</td><td class="num">$450</td><td class="num">0.6</td><td class="num gain">+$1,551</td></tr>
          <tr><td>Electrical</td><td class="num">$300</td><td class="num">0.8</td><td class="num gain">+$951</td></tr>
          <tr><td>Drainage &amp; sewer</td><td class="num">$500</td><td class="num">0.5</td><td class="num gain">+$1,751</td></tr>
          <tr><td>Dental (new patient)</td><td class="num">$400</td><td class="num">0.6</td><td class="num gain">+$1,351</td></tr>
        </tbody>
      </table>
    </div>
    <p class="mono fnote">Job values are industry-typical estimates, not guarantees. Use your own average ticket — the break-even is simply $249 divided by it. A dental patient's first visit is used here; lifetime value is considerably higher.</p>
    <div class="loss">
      <p class="cap">The other direction</p>
      <p class="big">Miss eight calls a month at $350 a job, and $2,800 walks to the next name on the list.</p>
    </div>
  </section>

  <hr class="rule" />

  <section>
    <p class="cap">What it costs</p>
    <h2 class="disp d36" style="margin-top:18px;">Less than one job it saves you.</h2>
    <div class="card" style="margin-top:36px;">
      <p class="cap">Per business, per month</p>
      <div class="amt"><b>$249</b><span>/ MONTH</span></div>
      <ul class="facts" style="margin-top:20px;">
        <li><b>First two weeks free.</b> If it doesn't catch you jobs, walk away — no charge.</li>
        <li><b>No setup fee.</b> I install it on your number myself; it takes about twenty minutes.</li>
        <li><b>Cancel any time.</b> No contract, no lock-in.</li>
      </ul>
    </div>
    <div class="addon" id="voice">
      <p class="cap">Add-on · set up on request</p>
      <h3 class="disp d32" style="margin-top:14px;">Rather have it answer out loud?</h3>
      <p class="body" style="margin-top:14px;max-width:50ch;">A voice agent picks up when you can't, asks the questions a good receptionist would, and hands you the lead. Same rules as the text line: it never quotes a price and never promises an arrival time.</p>
      <div class="amt"><b style="font-size:36px;letter-spacing:-.72px;">$549</b><span>/ MONTH</span></div>
    </div>
  </section>

  <hr class="rule" />

  <section id="get">
    <p class="cap">Get set up</p>
    <h2 class="disp d36" style="margin-top:18px;">I'll set it up on your number this week, free.</h2>
    <p class="body lede">Built and run out of Surrey, British Columbia. We're onboarding our first local businesses now — which is why there's no setup fee, and why you get me on the phone rather than a support queue.</p>
    <p class="cap" style="margin-top:44px;">Call or text</p>
    <a class="bignum" href="tel:+12366323334">(236) 632-3334</a>
    <div class="hero-cta" style="margin-top:28px;">
      <a class="pill pfill" href="tel:+12366323334">Call now</a>
      <a class="pill pout" href="sms:+12366323334">Send a text</a>
    </div>
  </section>

  <hr class="rule" />
  <div class="foot"><span class="mono">CallCatch</span><span class="mono">Surrey, British Columbia</span></div>
</div>
`;

export default function Home() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll("#thread .rv"));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      items.forEach((el) => el.classList.add("on"));
      return;
    }
    const delays = [200, 900, 1500, 2400, 3400, 4300, 5200];
    const timers = items.map((el, i) =>
      setTimeout(() => el.classList.add("on"), delays[i] ?? 200 + i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cc" dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
