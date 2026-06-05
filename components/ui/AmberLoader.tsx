"use client";

export function AmberLoader({ text }: { text?: string }) {
  return (
    <div className="amber-loader" style={{ display: "inline-block", position: "relative" }}>
      <span className="font-mono" style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
        {text || "loading"}
      </span>
    </div>
  );
}
