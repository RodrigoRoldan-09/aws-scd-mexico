import { SITE_HOST } from "@/lib/constants";

/**
 * Diseño común de las imágenes OG. Cada opengraph-image.tsx le pasa su título,
 * descripción y etiqueta.
 */
export function OGImage({
  title,
  description,
  label,
  locale = "es",
}: {
  title: string;
  description: string;
  label?: string;
  locale?: string;
}) {
  const dateStr = locale === "en" ? "November 4, 2026" : "4 de noviembre, 2026";
  const venueStr = locale === "en" ? "Mexico City" : "Ciudad de México";
  const domain = SITE_HOST;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "1200px",
        height: "630px",
        background: "#0A0A0F",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(242,166,240,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(242,166,240,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: "linear-gradient(90deg, #F2A6F0 0%, #FFB347 50%, #F2A6F0 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "56px 72px 0 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F2A6F0",
              borderRadius: 8,
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                color: "#0A0A0F",
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: "-0.5px",
              }}
            >
              AWS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              color: "#B0B0C0",
              fontSize: 15,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Student Builder Groups México
          </div>
          {label && (
            <>
              <div style={{ display: "flex", color: "#3A3A4A", fontSize: 15 }}>·</div>
              <div
                style={{
                  display: "flex",
                  color: "#F2A6F0",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#F2A6F0",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-1px",
              marginTop: 8,
            }}
          >
            México 2026
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#B0B0C0",
            fontSize: 22,
            lineHeight: 1.5,
            marginTop: 24,
            maxWidth: 820,
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 72px",
          borderTop: "1px solid #252530",
          marginTop: 24,
        }}
      >
        <div style={{ display: "flex", gap: 32 }}>
          <div style={{ display: "flex", color: "#B0B0C0", fontSize: 15, gap: 8 }}>
            <span style={{ display: "flex" }}>📅</span>
            <span style={{ display: "flex" }}>{dateStr}</span>
          </div>
          <div style={{ display: "flex", color: "#B0B0C0", fontSize: 15, gap: 8 }}>
            <span style={{ display: "flex" }}>📍</span>
            <span style={{ display: "flex" }}>{venueStr}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            color: "#F2A6F0",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {domain}
        </div>
      </div>
    </div>
  );
}
