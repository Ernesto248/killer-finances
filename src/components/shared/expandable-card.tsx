"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function ExpandableCard({ header, children, className, defaultExpanded = false }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      layout
      className={cn("bg-white rounded-xl ring-1 ring-border overflow-hidden cursor-pointer", className)}
      onClick={() => setExpanded(!expanded)}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-4">
        <div className="min-w-0">{header}</div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-end md:self-auto shrink-0">
          <ChevronDown className="size-4 text-[#9ca3af]" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
