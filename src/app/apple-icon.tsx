import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          borderRadius: 36,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        K
      </div>
    ),
    size
  );
}
