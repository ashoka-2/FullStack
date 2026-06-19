import React, { useState, useRef, useCallback } from "react";

const ZoomLens = ({ src, alt }) => {
  const ref = useRef(null);
  const [lens, setLens] = useState({ v: false, x: 0, y: 0, bx: 0, by: 0, bw: 0, bh: 0 });
  const SZ = 180;
  const ZF = 3;
  const onMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top, h = SZ / 2;
    const cx = Math.max(h, Math.min(x, r.width - h));
    const cy = Math.max(h, Math.min(y, r.height - h));
    setLens({ v: true, x: cx, y: cy, bx: -(cx * ZF - h), by: -(cy * ZF - h), bw: r.width * ZF, bh: r.height * ZF });
  }, []);
  const onLeave = useCallback(() => setLens(p => ({ ...p, v: false })), []);
  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden cursor-crosshair select-none" onMouseMove={onMove} onMouseLeave={onLeave}>
      <img src={src} alt={alt} className="w-full h-full object-cover object-top transition-opacity duration-300" draggable={false} />
      {lens.v && (
        <div className="absolute pointer-events-none rounded-full overflow-hidden" style={{ width: SZ, height: SZ, left: lens.x - SZ / 2, top: lens.y - SZ / 2, backgroundImage: `url(${src})`, backgroundSize: `${lens.bw}px ${lens.bh}px`, backgroundPosition: `${lens.bx}px ${lens.by}px`, backgroundRepeat: "no-repeat", border: "2px solid var(--color-accent)", boxShadow: "0 8px 45px rgba(0,0,0,0.5)", zIndex: 30 }}>
          <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at 30% 28%, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />
        </div>
      )}
    </div>
  );
};

export default ZoomLens;
