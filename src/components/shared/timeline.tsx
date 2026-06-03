"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  icon: React.ReactNode;
  amount?: string;
  amountColor?: "green" | "red" | "default";
  link?: string;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-[#6b7280] py-8 text-center">Sin actividad registrada</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-0">
        {events.map((evt, i) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative flex items-start gap-4 pl-10 py-3"
          >
            <div className="absolute left-2.5 top-4 size-3 rounded-full border-2 border-[#2563eb] bg-white" />
            <div className="size-8 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
              {evt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a]">{evt.title}</p>
              <p className="text-xs text-[#6b7280]">{evt.subtitle} · {evt.date}</p>
            </div>
            {evt.amount && (
              <span className={cn(
                "text-sm font-semibold shrink-0",
                evt.amountColor === "green" && "text-[#059669]",
                evt.amountColor === "red" && "text-[#dc2626]"
              )}>
                {evt.amount}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
