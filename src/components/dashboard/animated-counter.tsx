"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function AnimatedCounter({ value, duration = 0.5 }: { value: string; duration?: number }) {
  const numMatch = value.match(/[\d.,]+/);
  const num = numMatch ? parseFloat(numMatch[0].replace(/,/g, "")) : 0;
  const prefix = value.startsWith("$") ? "$" : "";
  const suffix = value.includes("CUP") ? " CUP" : "";

  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, num, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [num, duration]);

  const formatted = prefix
    ? `${prefix}${display.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${display.toLocaleString("es-CU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;

  return <span>{formatted}</span>;
}
