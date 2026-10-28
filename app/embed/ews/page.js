"use client";
import { useEffect, useRef, useState } from "react";

const MAX_WIDGET_MESSAGES = 7;
const HOME = "https://virtusaiworld.com";

function getIdentity() {
  const guestId = localStorage.getItem("virtus_guest_id") || crypto.randomUUID();
  const chatId = localStorage.getItem("virtus_chat_id") || crypto.randomUUID();
  localStorage.setItem("virtus_ews_embed_guest_id", guestId);
  localStorage.setItem("virtus_ews_embed_chat_id", chatId);
  return { guestId, chatId };
}

export default function EwsEmbedPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [trialFinished, setTrialFinished] = useState(false);
  const identity = useRef(null);
  const bottom = useRef(null);

  useEffect(() => {
    identity.current = getIdentity();
    fetch("/api/embed/guest", { method: "POST", credentials: "same-origin" })
      .then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Trial unavailable");
        const current = getIdentity(); identity.current = { ...current, guestId: data.guestId };
        localStorage.setItem("virtus_guest_id", data.guestId);
        return fetch("/api/conversations", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(identity.current) });
      })
      .then(r=>r.json())
      .then(data=>{ if(Array.isArray(data.conversation)){ const history = data.conversation.filter(m=>["user","assistant"].includes(m.role)); setMessages(history); localStorage.setItem("virtus_ews_embed_messages",JSON.stringify(history)); } if(data.access) localStorage.setItem("virtus_guest_access",JSON.stringify(data.access)); })
      .catch(err=>setNotice(err.message || "Trial unavailable"));
    try {
      const saved = JSON.parse(localStorage.getItem("virtus_ews_embed_messages") || "[]");
      if (Array.isArray(saved)) setMessages(saved.filter(m => ["user", "assistant"].includes(m.role)).slice(-30));
    } catch {}
  }, []);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, notice]);
  const used = messages.filter(m => m.role === "user").length;
  const limitReached = used >= MAX_WIDGET_MESSAGES || trialFinished;

  async function send(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy || limitReached || !identity.current || notice) return;
    const next = [...messages, { role: "user", text: message }];
    setMessages(next);
    localStorage.setItem("virtus_ews_embed_messages", JSON.stringify(next));
    setInput("");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identity.current, message, sessionTitle: "EWS Website Trial" }),
      });
      if (!response.ok) throw new Error("Unable to connect. Please try again.");
      const contentType = response.headers.get("content-type") || "";
      let reply = "";
      let access = null;
      if (contentType.includes("text/event-stream")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";
          for (const frame of frames) {
            const datum = frame.split("\n").find(line => line.startsWith("data: "));
            if (!datum) continue;
            let data;
            try { data = JSON.parse(datum.slice(6)); } catch { continue; }
            if (data.type === "done") { reply = data.reply || reply; access = data.access || access; }
            if (data.type === "error") throw new Error(data.error || "Chat failed");
          }
          if (done) break;
        }
      } else {
        const data = await response.json();
        reply = data.reply || "";
        access = data.access || null;
      }
      if (access?.planStatus === "expired" || (Number.isFinite(access?.dailyMessageLimit) && access.dailyMessagesUsed >= access.dailyMessageLimit)) setTrialFinished(true);
      if (!reply) throw new Error("Virtus did not return a reply. Please continue on Virtus AI World.");
      const completed = [...next, { role: "assistant", text: reply }];
      setMessages(completed);
      localStorage.setItem("virtus_ews_embed_messages", JSON.stringify(completed));
    } catch (error) {
      setNotice(error.message || "Connection problem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="head">
        <img src="/virtus-aurum-emblem.svg" alt="" className="logo" />
        <div><strong>Virtus <span>AI</span></strong><small>Life Coach · Trainer · Mentor</small></div>
        <span className="status" title="Embedded trial">Trial Guest</span>
      </header>
      <div className="thread" aria-label="Virtus AI trial conversation" aria-live="polite">
        <div className="bubble bot">Welcome. I'm Virtus AI. What would you like to explore today — your thinking, emotions, relationships, or personal growth?</div>
        {messages.map((m,i) => <div className={"bubble " + (m.role === "user" ? "visitor" : "bot")} key={i}>{m.text}</div>)}
        {busy && <div className="bubble bot" role="status">Virtus is thinking…</div>}
        {notice && <p className="notice" role="alert">{notice}</p>}
        {limitReached && <div className="handoff"><strong>Continue with Virtus AI</strong><p>Your EWS website preview has ended. Continue your three-day Trial Guest experience on the full platform.</p><a href={HOME} target="_blank" rel="noopener noreferrer">Open Virtus AI World ↗</a><small>Your messages are saved in the same Virtus Trial Guest conversation.</small></div>}
        <div ref={bottom} />
      </div>
      <footer>
        <div className="quota">{Math.min(used,MAX_WIDGET_MESSAGES)} of {MAX_WIDGET_MESSAGES} preview messages used</div>
        <form onSubmit={send}>
          <input aria-label="Message Virtus AI" placeholder={limitReached ? "Continue on Virtus AI World" : "Message Virtus AI…"} value={input} onChange={e=>setInput(e.target.value)} disabled={busy || limitReached} maxLength={2000} />
          <button type="submit" aria-label="Send message" disabled={!input.trim() || busy || limitReached}>➤</button>
        </form>
        <div className="footnote">For personal development. Not an emergency service.</div>
      </footer>
      <style jsx>{`
        *{box-sizing:border-box} .shell{height:100dvh;min-height:320px;display:flex;flex-direction:column;background:linear-gradient(160deg,#041b1a,#092c27 68%,#061c1b);color:#f5f0e4;font-family:Arial,Helvetica,sans-serif}.head{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid rgba(232,194,123,.32);background:#071d1d}.logo{height:42px;width:37px;object-fit:contain}.head strong{display:block;font:24px Georgia,serif;color:#efcf91}.head strong span{color:#95d4dd}.head small{display:block;font-size:10px;letter-spacing:.04em;color:#c1cec8;margin-top:4px}.status{margin-left:auto;border:1px solid #8e7848;border-radius:999px;padding:5px 8px;color:#e5cb98;font-size:10px;white-space:nowrap}.thread{padding:16px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:12px;min-height:0}.bubble{font-size:14px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px 14px;max-width:91%;border-radius:15px}.bot{align-self:flex-start;background:#183d37;border:1px solid #31554a}.visitor{align-self:flex-end;background:#d8bd85;color:#10231f}.notice{color:#ffd7b8;font-size:12px}.handoff{padding:14px;border:1px solid #cfad6e;background:#112f29;border-radius:14px;font-size:13px}.handoff p{line-height:1.5}.handoff a{display:block;text-align:center;background:#e3c68d;color:#0a2822;border-radius:10px;padding:12px;font-weight:bold;text-decoration:none}.handoff small{display:block;color:#b3c0b8;margin-top:11px;line-height:1.4}footer{padding:12px;background:#071d1d;border-top:1px solid rgba(232,194,123,.3)}.quota{font-size:11px;color:#ccb985;margin-bottom:9px}form{display:flex;gap:7px;border:1px solid #62765e;background:#112b28;border-radius:30px;padding:5px 6px 5px 15px}input{min-width:0;flex:1;background:transparent;border:none;outline:none;color:white;font-size:14px}button{border:0;border-radius:50%;width:36px;height:36px;background:#e3c68d;color:#0b2d25;cursor:pointer}button:disabled{opacity:.4;cursor:default}.footnote{text-align:center;color:#9caeaa;font-size:10px;margin-top:9px}
      `}</style>
    </main>
  );
}
