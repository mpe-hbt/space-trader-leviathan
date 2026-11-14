import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { tokens } from "../../theme/tokens";
import "./Tooltip.css";

export interface TooltipProps {
  content: ReactNode;
  /** A focusable element, e.g. a Button. */
  children: ReactElement<{ "aria-describedby"?: string }>;
}

/**
 * Shows `content` 200 ms after hover or focus. Stays open while the pointer moves from the
 * element onto the tooltip (WCAG 1.4.13); hides on leaving both, on blur and on Escape.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);
  const focused = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const hide = useCallback(() => {
    cancel();
    setVisible(false);
  }, [cancel]);

  function scheduleShow(): void {
    if (timer.current !== null) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setVisible(true);
    }, tokens.duration.normal);
  }

  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") hide();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, hide]);

  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");

  return (
    <span
      className="stl-tooltip-anchor"
      onMouseEnter={() => {
        hovered.current = true;
        scheduleShow();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        if (!focused.current) hide();
      }}
      onFocus={() => {
        focused.current = true;
        scheduleShow();
      }}
      onBlur={() => {
        focused.current = false;
        if (!hovered.current) hide();
      }}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span id={id} role="tooltip" className="stl-tooltip" hidden={!visible}>
        <span className="stl-tooltip__bubble">{content}</span>
      </span>
    </span>
  );
}
