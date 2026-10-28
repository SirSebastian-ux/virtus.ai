/* Virtus AI EWS floating trial widget. Install via Elementor HTML widget:
<script defer src="https://virtusaiworld.com/ews-virtus-widget.js"></script>
*/
(function () {
  "use strict";
  if (window.__virtusEwsWidgetLoaded) return;
  window.__virtusEwsWidgetLoaded = true;
  function mount() {
    if (document.getElementById("virtus-ews-widget")) return;
    const root = document.createElement("div");
    root.id = "virtus-ews-widget";
    const shadow = root.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      *{box-sizing:border-box}
      .launcher{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:62px;height:62px;border:1px solid #dbbc7e;border-radius:50%;background:linear-gradient(145deg,#084339,#04241f);box-shadow:0 8px 26px #0005;display:grid;place-items:center;cursor:pointer}
      .launcher img{width:42px;height:48px;object-fit:contain}
      .panel{position:fixed;z-index:2147483001;right:20px;bottom:94px;width:min(380px,calc(100vw - 24px));height:min(580px,calc(100dvh - 115px));border:1px solid #d8b67b;border-radius:18px;overflow:hidden;background:#061e1c;box-shadow:0 16px 55px #0007;display:none;flex-direction:column}
      .panel.open{display:flex}
      .top{height:35px;display:flex;justify-content:flex-end;align-items:center;padding:3px 8px;background:#05241e}
      .close{background:none;border:0;color:#f2d59d;font-size:24px;cursor:pointer;width:32px;height:30px}
      iframe{border:0;width:100%;flex:1;min-height:0;background:#071e1a}
      .launcher:focus-visible,.close:focus-visible{outline:3px solid #f2d59d;outline-offset:3px}
      @media(max-width:480px){.panel{right:8px;bottom:82px;width:calc(100vw - 16px);height:min(640px,calc(100dvh - 100px))}.launcher{right:14px;bottom:14px;width:56px;height:56px}}
    `;
    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "launcher";
    launcher.setAttribute("aria-label", "Chat with Virtus AI");
    launcher.setAttribute("aria-expanded", "false");
    const logo = document.createElement("img");
    logo.src = "https://virtusaiworld.com/virtus-aurum-emblem.svg";
    logo.alt = "Virtus AI";
    launcher.appendChild(logo);
    const panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("aria-label", "Virtus AI trial chat");
    const top = document.createElement("div");
    top.className = "top";
    const close = document.createElement("button");
    close.className = "close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close chat");
    top.appendChild(close);
    panel.appendChild(top);
    let loaded = false;
    function toggle(open) {
      if (open && !loaded) {
        const frame = document.createElement("iframe");
        frame.title = "Virtus AI Trial Guest";
        frame.src = "https://virtusaiworld.com/embed/ews";
        frame.setAttribute("allow", "clipboard-write");
        panel.appendChild(frame);
        loaded = true;
      }
      panel.classList.toggle("open", open);
      launcher.setAttribute("aria-expanded", String(open));
      if (open) close.focus(); else launcher.focus();
    }
    launcher.addEventListener("click", () => toggle(!panel.classList.contains("open")));
    close.addEventListener("click", () => toggle(false));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && panel.classList.contains("open")) toggle(false); });
    shadow.append(style, launcher, panel);
    document.body.appendChild(root);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
