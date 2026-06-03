"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function TasaEltoqueCard() {
  const [tasa, setTasa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/tasa-eltoque")
      .then((r) => r.json())
      .then((data) => {
        if (data.tasa) setTasa(data.tasa);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#7a7a7a]">Tasa elTOQUE (Referencia)</p>
        <TrendingUp className="size-4 text-[#7a7a7a]" />
      </div>
      <div className="mt-2">
        {loading ? (
          <span className="text-2xl font-semibold text-[#7a7a7a]">...</span>
        ) : error ? (
          <span className="text-2xl font-semibold text-[#7a7a7a]">&mdash;</span>
        ) : (
          <span className="text-2xl font-semibold text-white">{formatNumber(tasa!)} CUP</span>
        )}
        <p className="text-sm text-[#7a7a7a] mt-1">Tasa informal del mercado</p>
      </div>
    </div>
  );
}
