import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 48,
          height: 48,
          background: "linear-gradient(135deg, #613BB8 0%, #C143BC 100%)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: 900,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size }
  );
}
