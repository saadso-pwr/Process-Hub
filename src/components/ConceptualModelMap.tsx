"use client";

import React, { useRef, useEffect, useState } from "react";

const DESIGN_WIDTH  = 1806;
const DESIGN_HEIGHT = 1141;
const FF = "'Manrope', sans-serif";

/* Position of node 2:9055 (CRM/ERP/MES card group) in the design */
const CARDS_X = 747.96;
const CARDS_Y = 886.38;
const CARDS_W = 348;
const CARDS_H = 96;

const PORTCOS = [
  { name: "Panelmatic", logo: "/portcos/panelmatic.png" },
  { name: "MAS",        logo: "/portcos/mas.png" },
  { name: "Forgent",    logo: "/portcos/forgent.png" },
  { name: "Mill Creek", logo: "/portcos/mill-creek.png" },
  { name: "Gridstone",  logo: "/portcos/gridstone.png" },
  { name: "ANS",        logo: "/portcos/ans.png" },
  { name: "RMS Energy", logo: "/portcos/rms-energy.png" },
];

function PortcoPopup({ hotspotRect, wrapperRect, onClose }: {
  hotspotRect: DOMRect;
  wrapperRect: DOMRect;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const POPUP_W = 160;
  const left = hotspotRect.left - wrapperRect.left + (hotspotRect.width - POPUP_W) / 2;
  const top  = hotspotRect.top  - wrapperRect.top  + (hotspotRect.height - /* popup height approx */ 188) / 2;

  return (
    <div ref={popupRef} style={{
      position: "absolute",
      left,
      top,
      width: POPUP_W,
      zIndex: 100,
      background: "#fff",
      border: "1px solid #9b9b9b",
      borderRadius: 12,
      boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
      padding: "10px",
      pointerEvents: "auto",
    }}>
      <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 12, color: "#00037c", margin: 0, marginBottom: 8, textAlign: "center" }}>
        7 PortCos
      </p>
      <div style={{ height: 1, background: "#e0e0e0", marginBottom: 8 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {PORTCOS.map(({ name, logo }) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={name} style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />
            <p style={{ fontFamily: FF, fontWeight: 500, fontSize: 11, color: "#0d0d0e", margin: 0 }}>{name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConceptualModelMap() {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const hotspotRef  = useRef<HTMLDivElement>(null);
  const [scale, setScale]           = useState(1);
  const [imgHeight, setImgHeight]   = useState<number | undefined>(undefined);
  const [hovered, setHovered]       = useState(false);
  const [hotspotRect, setHotspotRect] = useState<DOMRect | null>(null);
  const [wrapperRect, setWrapperRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const update = () => {
      const s = Math.min(1, wrapper.clientWidth / DESIGN_WIDTH);
      setScale(s);
      setImgHeight(DESIGN_HEIGHT * s);
    };
    const obs = new ResizeObserver(update);
    obs.observe(wrapper);
    update();
    return () => obs.disconnect();
  }, []);

  const handleMouseEnter = () => {
    const hs = hotspotRef.current?.getBoundingClientRect();
    const wr = wrapperRef.current?.getBoundingClientRect();
    if (hs && wr) {
      setHotspotRect(hs);
      setWrapperRect(wr);
      setHovered(true);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", height: imgHeight }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/conceptual-model-v0.5.svg"
        alt="Conceptual Model v0.5"
        width={DESIGN_WIDTH}
        height={DESIGN_HEIGHT}
        style={{
          display: "block",
          width: "100%",
          height: imgHeight,
          objectFit: "fill",
        }}
      />

      {/* Transparent hotspot over the CRM/ERP/MES card group */}
      <div
        ref={hotspotRef}
        onMouseEnter={handleMouseEnter}
        style={{
          position: "absolute",
          left:   CARDS_X * scale,
          top:    CARDS_Y * scale,
          width:  CARDS_W * scale,
          height: CARDS_H * scale,
          cursor: "pointer",
          zIndex: 10,
        }}
      />

      {hovered && hotspotRect && wrapperRect && (
        <PortcoPopup
          hotspotRect={hotspotRect}
          wrapperRect={wrapperRect}
          onClose={() => setHovered(false)}
        />
      )}
    </div>
  );
}
