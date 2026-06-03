"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tasa elTOQUE (Referencia)</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : error ? (
          <div className="text-2xl font-bold text-muted-foreground">—</div>
        ) : (
          <div className="text-3xl font-bold text-emerald-400">
            {formatNumber(tasa!)} CUP
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">Tasa informal del mercado</p>
      </CardContent>
    </Card>
  );
}
