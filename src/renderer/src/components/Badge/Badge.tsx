import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { Icon } from "../Icon/Icon";
import "./Badge.css";

export type BadgeTone = "success" | "warning" | "danger" | "info";

const ICONS: Record<BadgeTone, LucideIcon> = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
};

export interface BadgeProps {
  tone: BadgeTone;
  /** Text is required: status is never shown by color or icon alone. */
  children: ReactNode;
  className?: string;
}

export function Badge({ tone, children, className }: BadgeProps) {
  const classes = ["stl-badge", `stl-badge--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      <Icon icon={ICONS[tone]} size={14} className="stl-badge__icon" />
      <span>{children}</span>
    </span>
  );
}
