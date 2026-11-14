import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { Icon } from "../Icon/Icon";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner, sets aria-busy and ignores clicks. */
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({
  variant = "secondary",
  loading = false,
  icon,
  type = "button",
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  const classes = ["stl-button", `stl-button--${variant}`, className].filter(Boolean).join(" ");
  return (
    <button
      {...rest}
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {loading ? (
        <Icon icon={LoaderCircle} className="stl-button__spinner" />
      ) : (
        icon && <Icon icon={icon} />
      )}
      {children}
    </button>
  );
}
