"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

useEffect(() => {
  const playPulse = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(72, audioContext.currentTime);

      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.45);
    } catch {
      // Audio blocked by browser. Ignore safely.
    }
  };

const enableSound = () => {
  playPulse();
 window.removeEventListener("pointerdown", enableSound);
window.removeEventListener("keydown", enableSound);
};

window.addEventListener("pointerdown", enableSound, { once: true });
window.addEventListener("keydown", enableSound, { once: true });

const showTimer = setTimeout(() => setVisible(true), 50);
   const fadeTimer = setTimeout(() => setFadeOut(true), 900);
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
   }, 1150);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
<div
  onPointerDown={() => {}}
  className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
<div
  className={`relative transition-all duration-700 ease-out ${
    visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
  }`}
>

  <img
    src="/virtus-logo.png"
    alt="Virtus AI"
   className="relative w-[840px] md:w-[1120px] h-auto brightness-110 contrast-110 saturate-125 drop-shadow-[0_0_10px_rgba(56,189,248,0.18)]"
  />

</div>
    </div>
  );
}