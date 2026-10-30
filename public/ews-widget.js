/* Virtus AI | EWS site-wide widget. All UI changes are managed in this file. */
(function () {
  "use strict";
  if (document.getElementById("virtus-ews-root")) return;
  function init() {
    if (document.getElementById("virtus-ews-root")) return;
    const root = document.createElement("div");
    root.id = "virtus-ews-root";
    const shadow = root.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host{all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:Arial,Helvetica,sans-serif}
      button{border:1px solid #d4af65;background:#10382d;color:#f2d28a;border-radius:999px;padding:14px 18px;font:700 14px Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:0 8px 24px #0003}
      button:focus-visible{outline:3px solid #d4af65;outline-offset:3px}
      @media(max-width:600px){:host{right:14px;bottom:14px}button{padding:13px 16px}}
    `;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "✦ Virtus AI";
    button.setAttribute("aria-label", "Open Virtus AI");
    // Temporary safe handoff: embedding is blocked by the current X-Frame-Options: DENY.
    // Replace this handler with the dedicated first-party embed when its guest flow is ready.
    button.addEventListener("click", function () {
      window.open("https://virtusaiworld.com/", "_blank", "noopener,noreferrer");
    });
    shadow.append(style, button);
    document.body.appendChild(root);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
