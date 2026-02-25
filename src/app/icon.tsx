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
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="#60a5fa"
            style={{
              filter: "drop-shadow(0 0 12px #3b82f6)",
            }}
          >
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2L12L9.6 9.6L12 2Z" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
