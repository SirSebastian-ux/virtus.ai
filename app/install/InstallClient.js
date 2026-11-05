"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InstallClient() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [platform, setPlatform] = useState("other");
  const [installed, setInstalled] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const detectedPlatform = isIos ? "ios" : /Android/i.test(ua) ? "android" : "other";
    const detectedInstalled = window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    queueMicrotask(() => {
      setPlatform(detectedPlatform);
      setInstalled(detectedInstalled);
    });
    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setNotice("Virtus AI has been installed.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function copyInstallLink() {
    const link = "https://virtusaiworld.com/install";
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Official installation link copied. Share it in WhatsApp or any messaging app.");
    } catch {
      setNotice("Copy this address to share: https://virtusaiworld.com/install");
    }
  }

  async function install() {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      setPromptEvent(null);
      if (result?.outcome !== "accepted") {
        setNotice("Installation was cancelled. You can still install from your browser menu.");
      } else {
        setNotice("Follow your browser's installation confirmation.");
      }
    } catch {
      setPromptEvent(null);
      setNotice("Use your browser menu to install Virtus AI.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#d8bd85]/50 bg-gradient-to-br from-[#10433a] via-[#0b2626] to-[#071515] px-6 py-9 shadow-2xl sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e7c883]">Virtus AI · Direct install</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-[#fff2ce] sm:text-5xl">Your space for growth, on your home screen.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#c9d9d1]">
          Install Virtus AI directly from this website. No app store account is required.
          Open it like an app on your phone, with your existing account and coaching experience.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {installed ? (
            <Link href="/" className="rounded-xl bg-[#e7c883] px-6 py-3 font-semibold text-[#09241e]">Open Virtus AI</Link>
          ) : promptEvent ? (
            <button type="button" onClick={install} className="rounded-xl bg-[#e7c883] px-6 py-3 font-semibold text-[#09241e] hover:bg-[#f7dfa4]">Install Virtus AI</button>
          ) : (
            <a href="#instructions" className="rounded-xl bg-[#e7c883] px-6 py-3 font-semibold text-[#09241e] hover:bg-[#f7dfa4]">Show installation steps</a>
          )}
          <Link href="/" className="rounded-xl border border-[#d8bd85]/60 px-6 py-3 font-semibold text-[#f8e7b9] hover:bg-white/10">Use in browser</Link>
          <button type="button" onClick={copyInstallLink} className="rounded-xl border border-[#d8bd85]/60 px-6 py-3 font-semibold text-[#f8e7b9] hover:bg-white/10">Copy installation link</button>
        </div>
        {installed && <p role="status" className="mt-4 text-sm text-[#e7c883]">This browser reports that Virtus AI is already installed.</p>}
        {notice && <p role="status" className="mt-4 text-sm text-[#e7c883]">{notice}</p>}
      </section>
      <section id="instructions" className="scroll-mt-8">
        <h2 className="font-serif text-2xl text-[#f6dfa7]">How to install</h2>
        <p className="mt-3 rounded-xl border border-[#d8bd85]/40 bg-[#0b2924] p-4 text-sm leading-6 text-[#f8e7b9]">
          <strong>Opening a link from WhatsApp, Facebook, or Instagram?</strong> If the link does not open correctly,
          choose <strong>Open in browser</strong> from that app&apos;s menu, or copy
          <span className="break-all"> https://virtusaiworld.com/install </span>
          into Chrome (Android) or Safari (iPhone). Do not use an unofficial APK link.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#c0d1ca]">Choose the instructions for your device. Browser menu labels can vary by version.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className={`rounded-2xl border p-6 ${platform === "android" ? "border-[#efcf8a] bg-[#123a31]" : "border-[#45675b] bg-[#0c2825]"}`}>
            <h3 className="text-xl font-semibold text-[#fff1c6]">Android</h3>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#d2ded7]">
              <li>Open <strong>virtusaiworld.com</strong> using Chrome on your Android device.</li>
              <li>Tap the browser menu (three dots).</li>
              <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Confirm the installation, then open Virtus AI from your home screen.</li>
            </ol>
          </article>
          <article className={`rounded-2xl border p-6 ${platform === "ios" ? "border-[#efcf8a] bg-[#123a31]" : "border-[#45675b] bg-[#0c2825]"}`}>
            <h3 className="text-xl font-semibold text-[#fff1c6]">iPhone and iPad</h3>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#d2ded7]">
              <li>Open <strong>virtusaiworld.com</strong> in Safari.</li>
              <li>Tap the Share button.</li>
              <li>Choose <strong>Add to Home Screen</strong>. If shown, turn on <strong>Open as Web App</strong>.</li>
              <li>Tap <strong>Add</strong>, then open the Virtus AI icon.</li>
            </ol>
          </article>
        </div>
      </section>
      <section className="rounded-2xl border border-[#45675b] bg-[#0c2825] p-6">
        <h2 className="font-serif text-xl text-[#f6dfa7]">A few things to know</h2>
        <p className="mt-3 text-sm leading-7 text-[#c7d8d0]">
          Virtus AI requires an internet connection for AI conversations, account access,
          synchronization, and subscriptions. Installation does not enable offline coaching.
          Updates are delivered through the website. This is the web-app version, not an Android APK.
        </p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm">
          <Link href="/privacy" className="text-[#efcf8a] underline underline-offset-4">Privacy</Link>
          <Link href="/support" className="text-[#efcf8a] underline underline-offset-4">Support</Link>
          <Link href="/pricing" className="text-[#efcf8a] underline underline-offset-4">Plans</Link>
        </div>
      </section>
    </div>
  );
}
