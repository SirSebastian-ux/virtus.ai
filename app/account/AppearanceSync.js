"use client";

import { useEffect } from "react";

export default function AppearanceSync() {
  useEffect(() => {
    function syncAppearance() {
      const savedAppearance = localStorage.getItem("virtus_appearance");
      const nextAppearance = savedAppearance === "light" ? "light" : "dark";

      document.documentElement.setAttribute(
        "data-virtus-appearance",
        nextAppearance
      );
    }

    syncAppearance();

    window.addEventListener("storage", syncAppearance);
    window.addEventListener("focus", syncAppearance);

    return () => {
      window.removeEventListener("storage", syncAppearance);
      window.removeEventListener("focus", syncAppearance);
    };
  }, []);

  return null;
}
