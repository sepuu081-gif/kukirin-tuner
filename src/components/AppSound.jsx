import { useEffect } from "react";
import { playSound } from "../lib/soundEngine";

export default function AppSound() {
  useEffect(() => {
    const tap = (event) => {
      if (event.target.closest("button, a, [role='button']")) playSound("tap");
    };
    document.addEventListener("pointerdown", tap, { passive: true });
    return () => document.removeEventListener("pointerdown", tap);
  }, []);
  return null;
}
