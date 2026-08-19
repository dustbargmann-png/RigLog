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
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 64 64">
          <rect x="14" y="12" width="36" height="44" rx="4" fill="#17324a" />
          <rect x="23" y="6" width="18" height="10" rx="3" fill="#b8860b" />
          <rect x="20" y="22" width="24" height="4" rx="2" fill="#eef2f6" />
          <rect x="20" y="30" width="18" height="4" rx="2" fill="#eef2f6" />
          <path
            d="M20 42 L27 49 L44 32"
            fill="none"
            stroke="#b8860b"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
