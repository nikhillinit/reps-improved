import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: ReactNode;
  label: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  value,
  label,
  sub,
  accent,
  danger,
  className,
  valueClassName,
}: StatCardProps) {
  const valueColor = danger
    ? "oklch(0.62 0.22 25)"
    : accent
      ? "oklch(0.72 0.14 185)"
      : "oklch(0.91 0.005 265)";

  return (
    <div className={cn("stat-card", className)}>
      <div
        className={cn("stat-value", valueClassName)}
        style={{ color: valueColor }}
      >
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && (
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 12,
            color: "oklch(0.40 0.01 265)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
