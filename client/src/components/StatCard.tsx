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
    ? "oklch(0.38 0.20 22)"
    : accent
      ? "oklch(0.44 0.15 150)"
      : "oklch(0.21 0 0)";

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
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            color: "oklch(0.51 0 0)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
