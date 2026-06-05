"use client";

interface ShowcaseToggleProps {
  isOn: boolean;
  onToggle: (val: boolean) => void;
}

export function ShowcaseToggle({ isOn, onToggle }: ShowcaseToggleProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 border-b" 
      style={{ 
        borderColor: "var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-border)"
      }}
    >
      <span 
        className="font-mono text-xs uppercase tracking-wider" 
        style={{ color: "var(--color-ink-dim)" }}
      >
        Showcase Mode
      </span>
      <button
        onClick={() => onToggle(!isOn)}
        className="font-mono text-xs border"
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          cursor: "pointer",
          backgroundColor: isOn ? "var(--color-accent-dim)" : "transparent",
          borderColor: isOn ? "var(--color-accent)" : "var(--color-border)",
          color: isOn ? "var(--color-accent)" : "var(--color-ink-dim)",
          transition: "all 150ms ease"
        }}
      >
        {isOn ? "LOCAL SEED" : "LIVE SAAS"}
      </button>
    </div>
  );
}
