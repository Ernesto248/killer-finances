"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Period = "today" | "week" | "month" | "quarter" | "custom";

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period, from?: Date, to?: Date) => void;
  className?: string;
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const periods: { value: Period; label: string }[] = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "quarter", label: "3 Meses" },
    { value: "custom", label: "Personalizado" },
  ];

  return (
    <div className={cn("flex gap-1 bg-muted rounded-lg p-1", className)}>
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={value === p.value ? "default" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            const now = new Date();
            let from: Date | undefined;
            const to: Date = now;
            if (p.value === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            else if (p.value === "week") from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (p.value === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (p.value === "quarter") from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            onChange(p.value, from, to);
          }}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
