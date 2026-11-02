"use client";

import Link from "next/link";

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {name === "home" && <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></>}
      {name === "chat" && <><path d="M20 11.4a7.7 7.7 0 0 1-8.1 7.7 9 9 0 0 1-3.7-.8L4 20l1.3-4a7.5 7.5 0 0 1-2.3-5.3 8.2 8.2 0 0 1 8.6-7.8c4.6 0 8.4 3.7 8.4 8.5Z" /></>}
      {name === "library" && <><path d="M12 5c-2.9-2-6-2.3-9-1.6v15.2c3.3-.9 6.4-.4 9 1.4 2.6-1.8 5.7-2.3 9-1.4V3.4c-3-.7-6.1-.4-9 1.6ZM12 5v15" /></>}
      {name === "tools" && <><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></>}
      {name === "settings" && <><path d="M10.3 2.7 9.7 5a7.7 7.7 0 0 0-1.7.9L5.8 5 3.5 8.8l1.8 1.6a8.8 8.8 0 0 0 0 2l-1.8 1.6L5.8 18l2.2-.9c.6.4 1.1.7 1.7.9l.6 2.3h4.4l.6-2.3a7.7 7.7 0 0 0 1.7-.9l2.2.9 2.3-4-1.8-1.6a8.8 8.8 0 0 0 0-2l1.8-1.6-2.3-3.8-2.2.9c-.6-.4-1.1-.7-1.7-.9l-.6-2.3h-4.4Z"/><circle cx="12.5" cy="11.5" r="2.8"/></>}
    </svg>
  );
}

export default function LuxurySidebarNav({ onHome, onNewChat, onLibrary, onTools, onRecent, recentOpen = false, active = "home" }) {
  const links = [
    { id: "home", title: "Home", action: onHome },
    { id: "chat", title: "New Chat", action: onNewChat },
    { id: "library", title: "Library", action: onLibrary },
    { id: "tools", title: "Tools", action: onTools },
  ];
  return (
    <div className="virtus-luxury-nav-wrap">
      <nav className="virtus-luxury-nav" aria-label="Main navigation">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={"virtus-luxury-nav-link" + (active === link.id ? " is-active" : "")}
            onClick={link.action}
            aria-current={active === link.id ? "page" : undefined}
          >
            <NavIcon name={link.id} />
            <span>{link.title}</span>
          </button>
        ))}
        <Link className="virtus-luxury-nav-link" href="/account">
          <NavIcon name="settings" />
          <span>Settings</span>
        </Link>
      </nav>
      <button
        type="button"
        className="virtus-luxury-recent-toggle"
        onClick={onRecent}
        aria-expanded={recentOpen}
      >
        <span>Recent conversations</span>
        <span aria-hidden="true" className={recentOpen ? "virtus-luxury-chevron is-open" : "virtus-luxury-chevron"}>⌄</span>
      </button>
    </div>
  );
}
