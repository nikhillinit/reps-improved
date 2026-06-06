import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.97 0.003 87)",
      }}
    >
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.90 0.013 78)",
          borderRadius: 8,
          padding: "48px 40px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 64,
            fontWeight: 700,
            color: "oklch(0.21 0 0)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: 16,
          }}
        >
          404
        </div>
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "oklch(0.21 0 0)",
            marginBottom: 8,
          }}
        >
          Page not found
        </div>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "oklch(0.51 0 0)",
            marginBottom: 28,
            lineHeight: 1.55,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 20px",
            background: "oklch(0.21 0 0)",
            border: "none",
            borderRadius: 4,
            color: "oklch(1 0 0)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 150ms ease-out",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.14 0 0)")}
          onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.21 0 0)")}
        >
          <Home size={14} />
          Go home
        </button>
      </div>
    </div>
  );
}
