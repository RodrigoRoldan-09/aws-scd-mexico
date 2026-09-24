"use client";

export function GradientMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(193,67,188,0.08), transparent),
            radial-gradient(ellipse 30% 30% at 50% 50%, rgba(97,59,184,0.06), transparent)
          `,
          animation: "drift 20s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
