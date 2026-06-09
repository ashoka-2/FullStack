import React from "react";

const CanvasElement = ({
    el,
    selectedId,
    editingTextId,
    isPenMode,
    setSelectedId,
    setEditingTextId,
    handleElementMouseDown,
    handleResizeStart,
    handleRotateStart,
    handleCanvasContextMenu,
    updateSelectedElement,
    pushToHistoryState,
    elements
}) => {
    const isSelected = el.id === selectedId;
    const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    
    const handleClasses = {
        nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
        n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
        ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
        e: "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize",
        se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
        s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
        sw: "-bottom-1.5 -left-1.5 cursor-nwse-resize",
        w: "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"
    };

    const getImageFilterStyle = (f) => {
        if (!f) return {};
        return {
            filter: `blur(${f.blur || 0}px) brightness(${f.brightness || 100}%) contrast(${f.contrast || 100}%) grayscale(${f.grayscale || 0}%) sepia(${f.sepia || 0}%)`
        };
    };

    // Compute the CSS background/fill value for a shape
    const getShapeFillCSS = (el) => {
        if (el.fillType === "gradient" && el.fillGradient) {
            const fg = el.fillGradient;
            const stops = (fg.stops || [{ color: fg.color1 || el.fill || "#4f46e5", offset: 0 }, { color: fg.color2 || "#db2777", offset: 100 }])
                .map(s => `${s.color} ${s.offset}%`).join(", ");
            if (fg.type === "radial") return `radial-gradient(circle, ${stops})`;
            if (fg.type === "conic") return `conic-gradient(from ${fg.conicAngle || "0deg"} at 50% 50%, ${stops})`;
            const dir = fg.direction === "to-b" ? "to bottom" : fg.direction === "to-tr" ? "to top right" : "to right";
            return `linear-gradient(${dir}, ${stops})`;
        }
        return el.fill || "transparent";
    };

    const handleTextDoubleClick = (e, targetEl) => {
        e.stopPropagation();
        if (targetEl.isLocked) return;
        setEditingTextId(targetEl.id);
        setSelectedId(targetEl.id);
    };

    // For SVG shapes with gradient fill, we need an SVG gradient def
    const getSvgGradientDef = (el) => {
        if (el.fillType !== "gradient" || !el.fillGradient) return null;
        const fg = el.fillGradient;
        const stops = fg.stops || [{ color: fg.color1 || el.fill || "#4f46e5", offset: 0 }, { color: fg.color2 || "#db2777", offset: 100 }];
        const gradId = `grad-el-${el.id}`;

        if (fg.type === "radial") {
            return (
                <defs>
                    <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
                        {stops.map((s, i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />)}
                    </radialGradient>
                </defs>
            );
        }
        // linear / conic
        const angle = fg.direction === "to-b" ? 90 : fg.direction === "to-tr" ? 315 : 0;
        const rad = angle * (Math.PI / 180);
        const x2 = 50 + 50 * Math.cos(rad);
        const y2 = 50 + 50 * Math.sin(rad);
        const x1 = 50 - 50 * Math.cos(rad);
        const y1 = 50 - 50 * Math.sin(rad);
        return (
            <defs>
                <linearGradient id={gradId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                    {stops.map((s, i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />)}
                </linearGradient>
            </defs>
        );
    };

    const svgFillRef = `url(#grad-el-${el.id})`;
    const svgFill = el.fillType === "gradient" ? svgFillRef : (el.fill || "transparent");

    return (
        <div
            id={`element-frame-${el.id}`}
            onMouseDown={(e) => handleElementMouseDown(e, el)}
            onContextMenu={(e) => handleCanvasContextMenu(e, el.id)}
            style={{
                position: "absolute",
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                zIndex: el.zIndex,
                transform: `rotate(${el.rotate || 0}deg)`,
                opacity: (el.opacity ?? 100) / 100,
                filter: el.shadowBlur > 0 
                    ? `drop-shadow(${el.shadowX || 0}px ${el.shadowY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor || "rgba(0,0,0,0.5)"})`
                    : "none",
                cursor: el.isLocked ? "not-allowed" : isPenMode ? "crosshair" : "move"
            }}
            className={`${isSelected ? "z-[1000]" : ""}`}
        >
            {/* Selection Outline & Handles (only show if not locked) */}
            {isSelected && !el.isLocked && (
                <>
                    <div className="absolute inset-0 border-[1.5px] border-[#00c0ff] pointer-events-none z-50" />
                    
                    <div className="absolute -top-5 left-0 bg-[#00c0ff] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow select-none pointer-events-none z-50">
                        {el.name || el.type}
                    </div>

                    {/* Rotation Handle */}
                    <div 
                        onMouseDown={(e) => handleRotateStart(e, el)}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#00c0ff] border-2 border-white rounded-full cursor-grab active:cursor-grabbing z-50 shadow-md flex items-center justify-center"
                        title="Drag to Rotate (Shift to snap)"
                    >
                        <div className="w-[1.5px] h-3 bg-[#00c0ff] absolute top-3" />
                    </div>

                    {/* 8 Resize Pins */}
                    {resizeHandles.map(handle => (
                        <div
                            key={handle}
                            onMouseDown={(e) => handleResizeStart(e, handle, el)}
                            className={`absolute w-2.5 h-2.5 bg-white border border-[#00c0ff] rounded-sm z-50 shadow-sm ${handleClasses[handle]}`}
                        />
                    ))}
                </>
            )}

            {/* Locked Element — show selection border + lock badge (no handles) */}
            {isSelected && el.isLocked && (
                <>
                    <div className="absolute inset-0 border-[1.5px] border-amber-400/60 pointer-events-none z-50 rounded-sm" />
                    <div className="absolute -top-5 left-0 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow select-none pointer-events-none z-50 flex items-center gap-1">
                        <i className="ri-lock-fill" />
                        {el.name || el.type} (Locked)
                    </div>
                </>
            )}

            {/* Render Context: Text */}
            {el.type === "text" && (
                editingTextId === el.id ? (
                    <textarea
                        value={el.content}
                        autoFocus
                        onChange={(e) => updateSelectedElement("content", e.target.value)}
                        onBlur={() => {
                            setEditingTextId(null);
                            pushToHistoryState(elements);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                setEditingTextId(null);
                                pushToHistoryState(elements);
                            }
                            if (e.key === "Escape") {
                                setEditingTextId(null);
                            }
                        }}
                        className="w-full h-full bg-transparent resize-none outline-none border-none p-0 m-0 overflow-hidden text-white"
                        style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.fontWeight,
                            textAlign: el.textAlign,
                            lineHeight: "1.25",
                            color: el.color
                        }}
                    />
                ) : (
                    <p
                        onDoubleClick={(e) => handleTextDoubleClick(e, el)}
                        style={{
                            width: "100%",
                            height: "100%",
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.fontWeight,
                            textAlign: el.textAlign,
                            lineHeight: "1.25",
                            whiteSpace: "pre-wrap",
                            color: el.isGradientText ? "transparent" : el.color,
                            background: el.isGradientText 
                                ? `linear-gradient(${el.textGradient.dir === "to-b" ? "180deg" : "90deg"}, ${el.textGradient.start}, ${el.textGradient.end})`
                                : "none",
                            WebkitBackgroundClip: el.isGradientText ? "text" : "unset",
                            backgroundClip: el.isGradientText ? "text" : "unset",
                            cursor: el.isLocked ? "not-allowed" : "text"
                        }}
                    >
                        {el.content}
                    </p>
                )
            )}

            {/* Render Context: Image */}
            {el.type === "image" && (
                <img
                    src={el.url}
                    alt="Canvas Graphic"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        borderRadius: `${el.borderRadius || 0}px`,
                        ...getImageFilterStyle(el.filter)
                    }}
                />
            )}

            {/* Render Context: Shape */}
            {el.type === "shape" && (
                <div className="w-full h-full" style={{ filter: el.blur > 0 ? `blur(${el.blur}px)` : "none" }}>
                    {/* Rect — uses CSS gradient via background */}
                    {el.shapeType === "rect" && (
                        <div 
                            className="w-full h-full" 
                            style={{ 
                                background: getShapeFillCSS(el),
                                border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none",
                                borderRadius: `${el.borderRadius || 0}px`
                            }} 
                        />
                    )}
                    {/* Circle — uses CSS gradient via background */}
                    {el.shapeType === "circle" && (
                        <div 
                            className="w-full h-full rounded-full" 
                            style={{ 
                                background: getShapeFillCSS(el),
                                border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none"
                            }} 
                        />
                    )}
                    {/* Polygon with optional SVG gradient */}
                    {el.shapeType === "polygon" && el.points && (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {getSvgGradientDef(el)}
                            <polygon
                                points={el.points}
                                fill={svgFill}
                                stroke={el.stroke}
                                strokeWidth={el.strokeWidth}
                            />
                        </svg>
                    )}
                    {/* Path with optional SVG gradient */}
                    {el.shapeType === "path" && el.path && (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {getSvgGradientDef(el)}
                            <path
                                d={el.path}
                                fill={svgFill}
                                stroke={el.stroke}
                                strokeWidth={el.strokeWidth}
                            />
                        </svg>
                    )}
                    {/* Custom pen-drawn shape */}
                    {el.shapeType === "custom" && el.path && (
                        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
                            {getSvgGradientDef(el)}
                            <polygon
                                points={el.path.map(pt => {
                                    const origW = el.originalWidth || el.width || 1;
                                    const origH = el.originalHeight || el.height || 1;
                                    return `${(pt.x / origW) * el.width},${(pt.y / origH) * el.height}`;
                                }).join(" ")}
                                fill={el.fillType === "gradient" ? svgFillRef : (el.fill || "transparent")}
                                stroke={el.stroke}
                                strokeWidth={el.strokeWidth}
                            />
                        </svg>
                    )}
                </div>
            )}
        </div>
    );
};

export default CanvasElement;
