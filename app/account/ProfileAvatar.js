"use client";

import { useEffect, useState } from "react";

export default function ProfileAvatar({ fallback = "V" }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let mounted = true;
    fetch("/api/account/avatar", { cache: "no-store" })
      .then(r => r.json()).then(data => { if (mounted) setUrl(data.url || ""); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  return url
    ? <img src={url} alt="Your profile" className="h-12 w-12 rounded-full border border-[#d8bd85]/40 object-cover" />
    : <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d8bd85]/40 bg-[#102b28] text-sm font-semibold text-[#e8c985]">{fallback}</div>;
}
