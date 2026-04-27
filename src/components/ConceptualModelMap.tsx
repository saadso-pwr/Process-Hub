"use client";

const DESIGN_WIDTH = 1806;
const DESIGN_HEIGHT = 1141;

export function ConceptualModelMap() {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/conceptual-model-v0.5.svg"
        alt="Conceptual Model v0.5"
        width={DESIGN_WIDTH}
        height={DESIGN_HEIGHT}
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
