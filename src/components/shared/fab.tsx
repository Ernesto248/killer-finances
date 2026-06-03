"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function FAB({ onClick, label = "Nuevo" }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-5 z-[60] md:hidden flex items-center gap-2 bg-[#2563eb] text-white rounded-2xl px-5 h-14 shadow-lg hover:bg-[#1d4ed8] transition-colors"
    >
      <Plus className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
