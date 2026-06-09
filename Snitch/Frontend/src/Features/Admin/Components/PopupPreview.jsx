import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PopupPreview — renders a live preview of the canvas poster
 * exactly as it would appear to buyers/sellers in PopupManager.
 * Supports switching between device breakpoints.
 */
const PopupPreview = ({
    deviceDesigns,   // { desktop, tablet, mobile, tv } — each has { elements, canvasBg, canvasWidth, canvasHeight }
    title,
    linkUrl,
    displayTime,
    borderRadius,
    onClose
}) => {
    const [activeDevice, setActiveDevice] = useState("desktop");

    const DEVICES = [
        { key: "tv",      label: "TV",      icon: "ri-tv-line",         w: 1280, h: 720 },
        { key: "desktop", label: "Desktop", icon: "ri-computer-line",   w: 800,  h: 500 },
        { key: "tablet",  label: "Tablet",  icon: "ri-tablet-line",     w: 540,  h: 700 },
        { key: "mobile",  label: "Mobile",  icon: "ri-smartphone-line", w: 360,  h: 640 },
    ];

    const design = deviceDesigns?.[activeDevice] || {};
    const { elements = [], canvasBg = { type: "solid", color1: "#111" }, canvasWidth = 380, canvasHeight = 500 } = design;

    const getBackgroundCSS = (bg) => {
        if (!bg) return "#111";
        if (bg.type === "solid") return bg.color1 || "#111";
        const stopsStr = (bg.stops || [
            { color: bg.color1 || "#111", offset: 0 },
            { color: bg.color2 || "#333", offset: 100 }
        ]).map(s => `${s.color} ${s.offset}%`).join(", ");
        if (bg.type === "linear") {
            const dir = bg.direction === "to-b" ? "to bottom" : bg.direction === "to-tr" ? "to top right" : "to right";
            return `linear-gradient(${dir}, ${stopsStr})`;
        }
        if (bg.type === "radial") return `radial-gradient(circle, ${stopsStr})`;
        if (bg.type === "conic") return `conic-gradient(from ${bg.conicAngle || "0deg"} at 50% 50%, ${stopsStr})`;
        if (bg.type === "mesh") {
            const pts = bg.meshPoints || [];
            return pts.map(p => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent ${p.radius || 65}%)`).join(", ");
        }
        return bg.color1 || "#111";
    };

    const getImageFilterStyle = (f) => {
        if (!f) return {};
        return { filter: `blur(${f.blur||0}px) brightness(${f.brightness||100}%) contrast(${f.contrast||100}%) grayscale(${f.grayscale||0}%) sepia(${f.sepia||0}%)` };
    };

    const getShapeFillCSS = (el) => {
        if (el.fillType === "gradient" && el.fillGradient) {
            const fg = el.fillGradient;
            const stops = (fg.stops || []).map(s => `${s.color} ${s.offset}%`).join(", ");
            if (fg.type === "radial") return `radial-gradient(circle, ${stops})`;
            if (fg.type === "conic") return `conic-gradient(from ${fg.conicAngle||"0deg"} at 50% 50%, ${stops})`;
            const dir = fg.direction === "to-b" ? "to bottom" : fg.direction === "to-tr" ? "to top right" : "to right";
            return `linear-gradient(${dir}, ${stops})`;
        }
        return el.fill || "transparent";
    };

    const getBorderRadiusCSSValue = (br) => {
        switch(br) {
            case "none": return "0px";
            case "md": return "12px";
            case "lg": return "16px";
            case "full": return "40px";
            default: return "24px";
        }
    };

    const hasElements = elements.length > 0;

    // Scale the canvas to fit within the preview container
    const MAX_PREVIEW_W = Math.min(window.innerWidth * 0.8, 700);
    const MAX_PREVIEW_H = Math.min(window.innerHeight * 0.7, 600);
    const scaleX = MAX_PREVIEW_W / canvasWidth;
    const scaleY = MAX_PREVIEW_H / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 30 }}
                    transition={{ type: "spring", stiffness: 280, damping: 26 }}
                    className="relative flex flex-col items-center gap-5 max-w-[90vw] max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between w-full px-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Live Preview</p>
                            <h3 className="text-sm font-black text-white mt-0.5 truncate max-w-[300px]">{title || "Popup Preview"}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
                        >
                            <i className="ri-close-line" />
                        </button>
                    </div>

                    {/* Device Tab Switcher */}
                    <div className="flex gap-1 bg-white/[0.06] border border-white/10 rounded-2xl p-1">
                        {DEVICES.map(d => (
                            <button
                                key={d.key}
                                onClick={() => setActiveDevice(d.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeDevice === d.key
                                        ? "bg-accent text-accent-content shadow"
                                        : "text-white/45 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <i className={d.icon} />
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Popup Frame Preview */}
                    <div
                        className="relative shadow-2xl overflow-hidden"
                        style={{
                            width: `${canvasWidth * scale}px`,
                            height: `${canvasHeight * scale}px`,
                            borderRadius: getBorderRadiusCSSValue(borderRadius),
                            background: getBackgroundCSS(canvasBg),
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                    >
                        {/* Grain overlay */}
                        {canvasBg?.grainOpacity > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none mix-blend-overlay z-[1999]"
                                style={{
                                    opacity: (canvasBg.grainOpacity || 0) / 100,
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0%200%20200%20200'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noiseFilter'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.8'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                }}
                            />
                        )}

                        {/* Elements Scaled */}
                        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
                            {[...elements].sort((a,b) => (a.zIndex||0) - (b.zIndex||0)).map(el => {
                                if (el.hidden) return null;
                                const shadowFilter = el.shadowBlur > 0
                                    ? `drop-shadow(${el.shadowX||0}px ${el.shadowY||0}px ${el.shadowBlur||0}px ${el.shadowColor||"rgba(0,0,0,0.5)"})`
                                    : "none";

                                return (
                                    <div
                                        key={el.id}
                                        style={{
                                            position: "absolute",
                                            left: `${el.x}px`,
                                            top: `${el.y}px`,
                                            width: `${el.width}px`,
                                            height: `${el.height}px`,
                                            zIndex: el.zIndex,
                                            transform: `rotate(${el.rotate||0}deg)`,
                                            opacity: (el.opacity ?? 100) / 100,
                                            filter: shadowFilter
                                        }}
                                    >
                                        {el.type === "text" && (
                                            <p style={{
                                                width: "100%", height: "100%",
                                                fontFamily: el.fontFamily,
                                                fontSize: `${el.fontSize}px`,
                                                fontWeight: el.fontWeight,
                                                textAlign: el.textAlign,
                                                lineHeight: "1.25",
                                                whiteSpace: "pre-wrap",
                                                color: el.isGradientText ? "transparent" : el.color,
                                                background: el.isGradientText
                                                    ? `linear-gradient(${el.textGradient?.dir === "to-b" ? "180deg" : "90deg"}, ${el.textGradient?.start}, ${el.textGradient?.end})`
                                                    : "none",
                                                WebkitBackgroundClip: el.isGradientText ? "text" : "unset",
                                                backgroundClip: el.isGradientText ? "text" : "unset",
                                                userSelect: "none"
                                            }}>
                                                {el.content}
                                            </p>
                                        )}
                                        {el.type === "image" && (
                                            <img src={el.url} alt="" style={{
                                                width: "100%", height: "100%", objectFit: "cover",
                                                pointerEvents: "none", borderRadius: `${el.borderRadius||0}px`,
                                                ...getImageFilterStyle(el.filter)
                                            }} />
                                        )}
                                        {el.type === "shape" && (
                                            <div className="w-full h-full" style={{ filter: el.blur > 0 ? `blur(${el.blur}px)` : "none" }}>
                                                {el.shapeType === "rect" && (
                                                    <div style={{
                                                        width: "100%", height: "100%",
                                                        background: getShapeFillCSS(el),
                                                        border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none",
                                                        borderRadius: `${el.borderRadius||0}px`
                                                    }} />
                                                )}
                                                {el.shapeType === "circle" && (
                                                    <div style={{
                                                        width: "100%", height: "100%", borderRadius: "50%",
                                                        background: getShapeFillCSS(el),
                                                        border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none"
                                                    }} />
                                                )}
                                                {(el.shapeType === "polygon" || el.shapeType === "path" || el.shapeType === "custom") && (
                                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        <defs>
                                                            {el.fillType === "gradient" && el.fillGradient && (() => {
                                                                const fg = el.fillGradient;
                                                                const stops = fg.stops || [];
                                                                if (fg.type === "radial") return (
                                                                    <radialGradient id={`grad-prev-${el.id}`}>
                                                                        {stops.map((s,i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />)}
                                                                    </radialGradient>
                                                                );
                                                                const angle = fg.direction === "to-b" ? 90 : fg.direction === "to-tr" ? 45 : 0;
                                                                return (
                                                                    <linearGradient id={`grad-prev-${el.id}`} gradientTransform={`rotate(${angle})`}>
                                                                        {stops.map((s,i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />)}
                                                                    </linearGradient>
                                                                );
                                                            })()}
                                                        </defs>
                                                        {el.shapeType === "polygon" && (
                                                            <polygon
                                                                points={el.points}
                                                                fill={el.fillType === "gradient" ? `url(#grad-prev-${el.id})` : (el.fill || "transparent")}
                                                                stroke={el.stroke} strokeWidth={el.strokeWidth}
                                                            />
                                                        )}
                                                        {el.shapeType === "path" && (
                                                            <path
                                                                d={el.path}
                                                                fill={el.fillType === "gradient" ? `url(#grad-prev-${el.id})` : (el.fill || "transparent")}
                                                                stroke={el.stroke} strokeWidth={el.strokeWidth}
                                                            />
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* No elements placeholder */}
                        {!hasElements && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                                <i className="ri-layout-masonry-line text-4xl mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">No elements on this device</p>
                            </div>
                        )}
                    </div>

                    {/* Info bar */}
                    <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest text-white/35">
                        <span>Size: {canvasWidth}×{canvasHeight}px</span>
                        <span>•</span>
                        <span>Auto-closes in {displayTime||5}s</span>
                        {linkUrl && <><span>•</span><span className="text-accent truncate max-w-[200px]">→ {linkUrl}</span></>}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PopupPreview;
