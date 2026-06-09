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

    const handleTextDoubleClick = (e, targetEl) => {
        e.stopPropagation();
        if (targetEl.isLocked) return;
        setEditingTextId(targetEl.id);
        setSelectedId(targetEl.id);
    };

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
                    : "none"
            }}
            className={`${isSelected ? "z-[1000]" : ""}`}
        >
            {/* Outline border & Handles */}
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
                            backgroundClip: el.isGradientText ? "text" : "unset"
                        }}
                        className="cursor-text"
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
                    {el.shapeType === "rect" && (
                        <div 
                            className="w-full h-full" 
                            style={{ 
                                backgroundColor: el.fill,
                                border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none",
                                borderRadius: `${el.borderRadius || 0}px`
                            }} 
                        />
                    )}
                    {el.shapeType === "circle" && (
                        <div 
                            className="w-full h-full rounded-full" 
                            style={{ 
                                backgroundColor: el.fill,
                                border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none"
                            }} 
                        />
                    )}
                    {el.shapeType === "polygon" && el.points && (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polygon
                                points={el.points}
                                fill={el.fill}
                                stroke={el.stroke}
                                strokeWidth={el.strokeWidth}
                            />
                        </svg>
                    )}
                    {el.shapeType === "path" && el.path && (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                                d={el.path}
                                fill={el.fill}
                                stroke={el.stroke}
                                strokeWidth={el.strokeWidth}
                            />
                        </svg>
                    )}
                    {el.shapeType === "custom" && el.path && (
                        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
                            <polygon
                                points={el.path.map(pt => {
                                    const origW = el.originalWidth || el.width || 1;
                                    const origH = el.originalHeight || el.height || 1;
                                    return `${(pt.x / origW) * el.width},${(pt.y / origH) * el.height}`;
                                }).join(" ")}
                                fill={el.fill}
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
