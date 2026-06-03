import { NextResponse } from "next/server";

let cachedRate: number | null = null;
let cachedAt: number = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchFromEltoque(): Promise<number | null> {
  const apiEndpoints = [
    "https://api.eltoque.com/v1/rates",
    "https://api.eltoque.com/rates",
    "https://eltoque.com/api/rates",
  ];

  for (const url of apiEndpoints) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const usd = data?.rates?.find?.((r: Record<string, unknown>) => r.code === "USD")?.price
        ?? data?.usd
        ?? data?.price
        ?? data?.data?.usd;
      if (usd) return Number(usd);
    } catch {
      continue;
    }
  }

  try {
    const res = await fetch("https://eltoque.com/tasas-de-cambio-de-moneda-en-cuba-hoy/", {
      headers: { "Accept": "text/html" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/1\s*USD\s*(\d+(?:\.\d+)?)\s*CUP/);
    if (match) return Number(match[1]);
  } catch {
    return null;
  }

  return null;
}

export async function GET() {
  const now = Date.now();

  if (cachedRate && now - cachedAt < CACHE_TTL) {
    return NextResponse.json({
      tasa: cachedRate,
      cached: true,
      updatedAt: new Date(cachedAt).toISOString(),
    });
  }

  const rate = await fetchFromEltoque();
  if (rate) {
    cachedRate = rate;
    cachedAt = now;
    return NextResponse.json({
      tasa: cachedRate,
      cached: true,
      updatedAt: new Date(cachedAt).toISOString(),
    });
  }

  if (cachedRate) {
    return NextResponse.json({
      tasa: cachedRate,
      cached: true,
      updatedAt: new Date(cachedAt).toISOString(),
      stale: true,
    });
  }

  return NextResponse.json({
    tasa: null,
    error: "No se pudo obtener la tasa de elTOQUE",
  });
}
