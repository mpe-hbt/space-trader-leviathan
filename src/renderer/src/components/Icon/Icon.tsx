import type { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  /** Edge length in px. */
  size?: number;
  strokeWidth?: number;
  /** Accessible name. Without a label the icon is decorative and hidden from assistive tech. */
  label?: string;
  className?: string;
}

/** Lucide icon with the default stroke width 1.5 in the current text color (ADR-03). */
export function Icon({
  icon: LucideComponent,
  size = 16,
  strokeWidth = 1.5,
  label,
  className,
}: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <LucideComponent
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
      className={className}
      focusable="false"
      {...a11y}
    />
  );
}
