import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { formatSEK } from "@/lib/format";

export const alt = `${site.name} – bilvård, biltvätt och mobil bilvård i ${site.baseTown}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const lowest = Math.min(...site.services.map((s) => s.price));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "radial-gradient(ellipse at 75% 10%, #3a3c42 0%, #16171a 45%, #08090a 80%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 68,
              background: "white",
              color: "black",
              borderRadius: 10,
              fontSize: 36,
              fontWeight: 900,
              fontStyle: "italic",
            }}
          >
            EA
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 4 }}>EA AUTO DETAIL</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1 }}>Ren bil.</div>
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1.05, color: "#b0b2b8" }}>Utan krångel.</div>
          <div style={{ marginTop: 32, fontSize: 30, color: "#d4d5d9" }}>
            {`Biltvätt & invändig rengöring från ${formatSEK(lowest)}`}
          </div>
          <div style={{ marginTop: 8, fontSize: 30, color: "#b0b2b8" }}>
            {`Mobil bilvård eller hämtning · ${site.baseTown} med omnejd`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
