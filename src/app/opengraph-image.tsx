import { ImageResponse } from "next/og";

export const alt = "KillerFinances - Panel Financiero";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: 0.9,
            }}
          >
            KillerFinances
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Panel Financiero
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              opacity: 0.85,
              maxWidth: 900,
            }}
          >
            Cuadres, wires, reventas y gastos en un solo lugar.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            opacity: 0.8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#22c55e",
            }}
          />
          <span>Hecho para remeseros y operadores de cambio</span>
        </div>
      </div>
    ),
    size
  );
}
