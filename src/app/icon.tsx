import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 40% 35%, #0f2060 0%, #02050a 70%)",
          borderRadius: "24px",
        }}
      >
        {/* Star ring */}
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            border: "2px solid rgba(96,165,250,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Central star symbol */}
          <div
            style={{
              fontSize: 72,
              color: "#60a5fa",
              lineHeight: 1,
              textShadow: "0 0 24px #3b82f6",
            }}
          >
            ✦
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
