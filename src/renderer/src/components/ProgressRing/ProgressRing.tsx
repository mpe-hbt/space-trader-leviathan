import "./ProgressRing.css";

export interface ProgressRingProps {
  /** Progress in percent; clamped to 0–100. */
  value: number;
  /** Remaining time as text, e.g. "2:30". */
  remaining: string;
  /** Accessible name, e.g. "Ankunft". */
  label: string;
  kind: "arrival" | "cooldown";
  /** Edge length in px. */
  size?: number;
}

const STROKE = 4;

export function ProgressRing({ value, remaining, label, kind, size = 64 }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  return (
    <div
      className={`stl-progress-ring stl-progress-ring--${kind}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-valuetext={`${Math.round(clamped)} %, noch ${remaining}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="stl-progress-ring__track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className="stl-progress-ring__arc"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="stl-progress-ring__text">{remaining}</span>
    </div>
  );
}
