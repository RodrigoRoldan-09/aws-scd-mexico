import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #F2A6F0 0%, #C143BC 100%)",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: "#0A0A0F",
            fontSize: 56,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          AWS
        </div>
        <div
          style={{
            width: 80,
            height: 6,
            background: "#0A0A0F",
            borderRadius: "0 0 12px 12px",
            marginTop: 6,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
