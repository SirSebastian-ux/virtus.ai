"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 40);
    const fadeTimer = setTimeout(() => setFadeOut(true), 1050);
    const finishTimer = setTimeout(() => onFinish?.(), 1350);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="Opening Virtus AI"
      className={`fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#091b1c] px-6 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(32,88,77,0.38)_0%,rgba(9,27,28,0)_65%)]" />
      <div
        className={`relative flex w-full max-w-md flex-col items-center text-center transition-all duration-700 ease-out motion-reduce:transition-none ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
      >
        <Image
          src="/virtus-logo.png"
          alt="Virtus AI gold and blue shield with a central I and water reflection"
          width={220}
          height={245}
          priority
          className="h-auto w-[132px] sm:w-[170px] drop-shadow-[0_0_24px_rgba(218,181,104,0.16)]"
        />
        <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-[#e8c985] sm:text-5xl">
          Virtus <span className="text-[#8ad5e6]">AI</span>
        </h1>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8bd85] sm:text-xs">
          By Enhanced Wellness Solutions
        </p>
        <div className="mt-8 h-px w-36 bg-gradient-to-r from-transparent via-[#d8bd85]/60 to-transparent" />
        <p className="mt-5 text-sm tracking-wide text-[#c2d3ce]">
          Life Coach · Trainer · Mentor
        </p>
      </div>
    </div>
  );
}
