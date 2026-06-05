"use client";

export function EmptyRepoState({ onAddDecision }: { onAddDecision?: () => void }) {
  return (
    <section
      className="flex flex-col items-center justify-center"
      style={{ minHeight: "60vh", textAlign: "center" }}
    >
      <p className="font-mono" style={{ fontSize: 14, color: "var(--color-ink-dim)", marginBottom: 24 }}>
        no memory yet
      </p>
      <p
        className="font-mono"
        style={{
          fontSize: 12,
          color: "var(--color-ink-muted)",
          lineHeight: 1.8,
          maxWidth: 320,
          marginBottom: 32
        }}
      >
        mnemo learns from pr comments, adr files,
        <br />
        and anything you tell it.
      </p>
      <div className="flex flex-col items-center" style={{ gap: 12 }}>
        {onAddDecision && (
          <button
            className="cta-outlined btn-press"
            onClick={onAddDecision}
            style={{ fontSize: 12 }}
          >
            add your first decision manually
          </button>
        )}
        <p className="font-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
          or connect github to start listening
        </p>
      </div>
    </section>
  );
}
