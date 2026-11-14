import { useId, type ReactNode } from "react";
import "./Card.css";

export interface CardProps {
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Controls shown in the head next to the title. */
  actions?: ReactNode;
  /** Active or selected: 2 px accent line on top. */
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Card({
  title,
  headingLevel = 3,
  actions,
  active = false,
  className,
  children,
}: CardProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  const hasHead = title !== undefined || actions !== undefined;
  const classes = ["stl-card", className].filter(Boolean).join(" ");
  return (
    <section
      className={classes}
      data-active={active || undefined}
      aria-labelledby={title !== undefined ? titleId : undefined}
    >
      {hasHead && (
        <header className="stl-card__head">
          {title !== undefined && (
            <Heading id={titleId} className="stl-card__title">
              {title}
            </Heading>
          )}
          {actions !== undefined && <div className="stl-card__actions">{actions}</div>}
        </header>
      )}
      <div className="stl-card__body">{children}</div>
    </section>
  );
}
