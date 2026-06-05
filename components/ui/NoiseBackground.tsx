"use client";

export function NoiseBackground() {
  return (
    <>
      <svg aria-hidden="true" className="hidden">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="noise-overlay noise-animate" aria-hidden="true" />
    </>
  );
}
