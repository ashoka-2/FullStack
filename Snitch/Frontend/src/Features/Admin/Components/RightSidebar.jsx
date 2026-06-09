import React, { useRef, useEffect } from "react";

const RightSidebar = ({
    selectedItem,
    updateSelectedElement,
    handleDeleteElement,
    handleAlign,
    popularFonts,
    loadGoogleFont,
    borderRadius,
    setBorderRadius,
    title,
    setTitle,
    linkUrl,
    setLinkUrl,
    canvasBg,
    setCanvasBg,
    elements,
    pushToHistoryState,
    addGradientStop,
    updateGradientStop,
    removeGradientStop,
    getStops,
    getCanvasBackgroundCSS,
    canvasSizes,
    canvasWidth,
    setCanvasWidth,
    canvasHeight,
    setCanvasHeight,
    saveToLocalStorage,
    canvasBgRef,
    // Sizing duration & Mesh Point parameters
    displayTime,
    setDisplayTime,
    selectedMeshPointId,
    setSelectedMeshPointId,
    handleAddMeshPoint,
    handleRemoveMeshPoint,
    handleUpdateMeshPoint,
    handleMoveMeshPointUp,
    handleMoveMeshPointDown,
    handleMoveMeshPointFront,
    handleMoveMeshPointBack,
    clipContent,
    setClipContent
}) => {
    const selectedItemRef = useRef(selectedItem);
    useEffect(() => {
        selectedItemRef.current = selectedItem;
    }, [selectedItem]);

    const inputCls = "w-full bg-[#1b1b1f] border border-white/10 focus:border-accent rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-medium";
    const inputDisabledCls = "w-full bg-[#1b1b1f]/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/30 outline-none font-medium cursor-not-allowed";
    const sliderCls = "w-full accent-accent bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer";

    // Update background settings helper
    const updateBgKey = (key, value) => {
        const updated = { ...canvasBg, [key]: value };
        setCanvasBg(updated);
        saveToLocalStorage(elements, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
    };

    // Apply predefined size aspect ratios
    const handleSelectSizePreset = (presetName) => {
        const found = canvasSizes.find(s => s.name === presetName);
        if (found) {
            setCanvasWidth(found.width);
            setCanvasHeight(found.height);
            saveToLocalStorage(elements, canvasBg, borderRadius, title, linkUrl, found.width, found.height, displayTime);
        }
    };

    // Quick Image Effects Presets
    const applyImageEffectPreset = (presetName) => {
        let filterVal = { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 };
        let extraStyles = { shadowBlur: 0, shadowX: 0, shadowY: 0 };
        
        switch(presetName) {
            case "vintage":
                filterVal = { blur: 0, brightness: 95, contrast: 110, grayscale: 0, sepia: 55 };
                break;
            case "mono":
                filterVal = { blur: 0, brightness: 100, contrast: 145, grayscale: 100, sepia: 0 };
                break;
            case "cyberpunk":
                filterVal = { blur: 0, brightness: 120, contrast: 140, grayscale: 0, sepia: 0 };
                extraStyles = { shadowBlur: 15, shadowColor: "#ff007f", shadowX: 0, shadowY: 0 };
                break;
            case "dreamy":
                filterVal = { blur: 4, brightness: 110, contrast: 90, grayscale: 0, sepia: 0 };
                break;
            case "sunset":
                filterVal = { blur: 0, brightness: 105, contrast: 115, grayscale: 0, sepia: 30 };
                break;
            case "nordic":
                filterVal = { blur: 0, brightness: 90, contrast: 110, grayscale: 30, sepia: 0 };
                break;
            case "chrome":
                filterVal = { blur: 0, brightness: 100, contrast: 140, grayscale: 0, sepia: 0 };
                break;
            case "vibrant":
                filterVal = { blur: 0, brightness: 115, contrast: 120, grayscale: 0, sepia: 5 };
                break;
            case "original":
            default:
                filterVal = { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 };
                extraStyles = { shadowBlur: 0, shadowX: 0, shadowY: 0 };
                break;
        }

        updateSelectedElement("filter", filterVal);
        Object.keys(extraStyles).forEach(k => {
            updateSelectedElement(k, extraStyles[k]);
        });
    };

    const getPresetFilterStyle = (presetName) => {
        switch(presetName) {
            case "vintage":
                return { filter: "sepia(55%) brightness(95%) contrast(110%)" };
            case "mono":
                return { filter: "grayscale(100%) contrast(145%) brightness(100%)" };
            case "cyberpunk":
                return { filter: "contrast(140%) brightness(120%)" };
            case "dreamy":
                return { filter: "blur(2px) brightness(110%) contrast(90%)" };
            case "sunset":
                return { filter: "sepia(30%) brightness(105%) contrast(115%)" };
            case "nordic":
                return { filter: "grayscale(30%) contrast(110%) brightness(90%)" };
            case "chrome":
                return { filter: "contrast(140%) brightness(100%)" };
            case "vibrant":
                return { filter: "contrast(120%) brightness(115%) sepia(5%)" };
            case "original":
            default:
                return { filter: "none" };
        }
    };

    const points = canvasBg.meshPoints || [
        { id: "mesh-1", x: 10, y: 15, color: canvasBg.color1 || "#4f46e5", radius: 65 },
        { id: "mesh-2", x: 90, y: 10, color: canvasBg.color2 || "#db2777", radius: 65 },
        { id: "mesh-3", x: 85, y: 85, color: canvasBg.color3 || "#b91c1c", radius: 65 },
        { id: "mesh-4", x: 15, y: 90, color: canvasBg.color4 || "#065f46", radius: 65 }
    ];

    const currentMeshPointIndex = points.findIndex((p, idx) => p.id === selectedMeshPointId || idx === selectedMeshPointId);
    const activeMeshPt = currentMeshPointIndex !== -1 ? points[currentMeshPointIndex] : points[0];
    const activeMeshPtId = activeMeshPt?.id || 0;

    // Local drag ref for gradient stop dragging (does not need to be shared with parent)
    const dragInfo = useRef({ isDraggingStop: false, stopIndex: 0, startX: 0, startOffset: 0 });

    // Helper to get fill gradient stops for a shape element
    const getShapeFillGradientStops = () => {
        const fg = selectedItemRef.current?.fillGradient;
        if (!fg) return [{ color: selectedItemRef.current?.fill || "#4f46e5", offset: 0 }, { color: "#db2777", offset: 100 }];
        return fg.stops || [{ color: fg.color1 || selectedItemRef.current?.fill || "#4f46e5", offset: 0 }, { color: fg.color2 || "#db2777", offset: 100 }];
    };

    const updateShapeFillGradient = (key, value) => {
        const current = selectedItemRef.current?.fillGradient || { type: "linear", direction: "to-r", stops: [{ color: selectedItemRef.current?.fill || "#4f46e5", offset: 0 }, { color: "#db2777", offset: 100 }] };
        updateSelectedElement("fillGradient", { ...current, [key]: value });
    };

    const addShapeGradientStop = (offset, color = "#ffffff") => {
        const stops = getShapeFillGradientStops();
        const updated = [...stops, { color, offset }].sort((a, b) => a.offset - b.offset);
        updateShapeFillGradient("stops", updated);
    };

    const updateShapeGradientStop = (index, key, value) => {
        const stops = getShapeFillGradientStops();
        const updated = stops.map((s, i) => i === index ? { ...s, [key]: value } : s);
        // Don't sort during live color changes, only sort offset after drag ends
        updateShapeFillGradient("stops", updated);
    };

    const removeShapeGradientStop = (index) => {
        const stops = getShapeFillGradientStops();
        if (stops.length <= 2) return;
        updateShapeFillGradient("stops", stops.filter((_, i) => i !== index));
    };

    return (
        <div className="w-80 bg-[#18181c] border-l border-white/5 overflow-y-auto popup-custom-scrollbar p-5 space-y-6 flex flex-col h-full text-white select-none">
            {selectedItem ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Inspector Properties</h3>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => updateSelectedElement("isLocked", !selectedItem.isLocked)} 
                                className="p-1 hover:bg-white/5 rounded text-white cursor-pointer transition-colors"
                                title={selectedItem.isLocked ? "Unlock layer" : "Lock layer"}
                            >
                                <i className={selectedItem.isLocked ? "ri-lock-fill text-accent" : "ri-lock-unlock-line"} />
                            </button>
                            <button 
                                onClick={handleDeleteElement} 
                                className="p-1 hover:bg-red-500/20 rounded text-red-400 cursor-pointer transition-colors"
                                title="Delete Layer"
                            >
                                <i className="ri-delete-bin-line" />
                            </button>
                        </div>
                    </div>

                    {/* 🔒 Locked Element Banner */}
                    {selectedItem.isLocked && (
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <i className="ri-lock-fill text-amber-400 text-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Layer is Locked</p>
                                <p className="text-[9px] text-amber-400/60 mt-0.5">Unlock to edit position, color, or any property.</p>
                            </div>
                            <button
                                onClick={() => updateSelectedElement("isLocked", false)}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-[8px] font-black uppercase rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                            >
                                Unlock
                            </button>
                        </div>
                    )}
                    {/* Bounded settings content — fully disabled when locked */}
                    <div className={`space-y-5 ${selectedItem.isLocked ? "pointer-events-none opacity-50" : ""}`}>
                        {/* Quick Align relative to dynamic canvas bounds */}
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/45">Quick Align</label>
                            <div className="grid grid-cols-6 gap-1 mt-1 bg-white/5 p-1 rounded-xl">
                                <button onClick={() => handleAlign("left")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Left"><i className="ri-align-left" /></button>
                                <button onClick={() => handleAlign("h_center")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Horizontal Center"><i className="ri-align-center" /></button>
                                <button onClick={() => handleAlign("right")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Right"><i className="ri-align-right" /></button>
                                <button onClick={() => handleAlign("top")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Top"><i className="ri-align-top" /></button>
                                <button onClick={() => handleAlign("v_center")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Vertical Center"><i className="ri-align-vertically" /></button>
                                <button onClick={() => handleAlign("bottom")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center transition-colors" title="Align Bottom"><i className="ri-align-bottom" /></button>
                            </div>
                        </div>

                        {/* Numeric Dimension Inputs */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">X Position</label>
                                <input 
                                    type="number" 
                                    value={selectedItem.x} 
                                    onChange={e => updateSelectedElement("x", parseInt(e.target.value) || 0)} 
                                    className={inputCls} 
                                    disabled={selectedItem.isLocked}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Y Position</label>
                                <input 
                                    type="number" 
                                    value={selectedItem.y} 
                                    onChange={e => updateSelectedElement("y", parseInt(e.target.value) || 0)} 
                                    className={inputCls} 
                                    disabled={selectedItem.isLocked}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Width (px)</label>
                                <input 
                                    type="number" 
                                    value={selectedItem.width} 
                                    onChange={e => updateSelectedElement("width", parseInt(e.target.value) || 10)} 
                                    className={inputCls} 
                                    disabled={selectedItem.isLocked}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Height (px)</label>
                                <input 
                                    type="number" 
                                    value={selectedItem.height} 
                                    onChange={e => updateSelectedElement("height", parseInt(e.target.value) || 10)} 
                                    className={inputCls} 
                                    disabled={selectedItem.isLocked}
                                />
                            </div>
                        </div>

                        {/* Global Transforms: Rotation, Opacity */}
                        <div className="space-y-3.5 pt-1">
                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase text-white/45 mb-1.5">
                                    <span>Rotation Angle</span>
                                    <span className="font-mono text-accent">{selectedItem.rotate || 0}°</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="360" 
                                    value={selectedItem.rotate || 0} 
                                    onChange={e => updateSelectedElement("rotate", parseInt(e.target.value))} 
                                    className={sliderCls} 
                                    disabled={selectedItem.isLocked}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase text-white/45 mb-1.5">
                                    <span>Layer Opacity</span>
                                    <span className="font-mono text-accent">{selectedItem.opacity ?? 100}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={selectedItem.opacity ?? 100} 
                                    onChange={e => updateSelectedElement("opacity", parseInt(e.target.value))} 
                                    className={sliderCls} 
                                />
                            </div>
                        </div>

                        {/* Text Config Panel */}
                        {selectedItem.type === "text" && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Text Content</label>
                                    <textarea 
                                        rows="3" 
                                        value={selectedItem.content} 
                                        onChange={e => updateSelectedElement("content", e.target.value)} 
                                        className={inputCls} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Font Family</label>
                                    <select 
                                        value={selectedItem.fontFamily} 
                                        onChange={e => {
                                            loadGoogleFont(e.target.value);
                                            updateSelectedElement("fontFamily", e.target.value);
                                        }} 
                                        className={inputCls}
                                    >
                                        {popularFonts.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Font Size</label>
                                        <input type="number" value={selectedItem.fontSize} onChange={e => updateSelectedElement("fontSize", parseInt(e.target.value) || 12)} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Font Weight</label>
                                        <select value={selectedItem.fontWeight} onChange={e => updateSelectedElement("fontWeight", e.target.value)} className={inputCls}>
                                            <option value="normal">Normal</option>
                                            <option value="medium">Medium</option>
                                            <option value="bold">Bold</option>
                                            <option value="black">Black</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Text Align</label>
                                    <select value={selectedItem.textAlign} onChange={e => updateSelectedElement("textAlign", e.target.value)} className={inputCls}>
                                        <option value="left">Left Align</option>
                                        <option value="center">Center Align</option>
                                        <option value="right">Right Align</option>
                                    </select>
                                </div>

                                {/* Text Gradient Options */}
                                <div className="flex items-center gap-2 py-1.5">
                                    <input 
                                        type="checkbox" 
                                        id="isGradientText" 
                                        checked={selectedItem.isGradientText || false} 
                                        onChange={e => updateSelectedElement("isGradientText", e.target.checked)} 
                                        className="w-4 h-4 accent-accent cursor-pointer"
                                    />
                                    <label htmlFor="isGradientText" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">Use Gradient Text</label>
                                </div>

                                {!selectedItem.isGradientText ? (
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Text Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={selectedItem.color || "#ffffff"} onChange={e => updateSelectedElement("color", e.target.value)} className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            <input type="text" value={selectedItem.color || "#ffffff"} onChange={e => updateSelectedElement("color", e.target.value)} className={inputCls} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5 border-l border-white/10 pl-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[8px] font-bold text-white/40 block mb-1">Start Color</label>
                                                <input type="color" value={selectedItem.textGradient?.start || "#ffffff"} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, start: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/40 block mb-1">End Color</label>
                                                <input type="color" value={selectedItem.textGradient?.end || "#000000"} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, end: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Flow Direction</label>
                                            <select value={selectedItem.textGradient?.dir || "to-r"} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, dir: e.target.value })} className={inputCls}>
                                                <option value="to-r">Horizontal</option>
                                                <option value="to-b">Vertical</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Image Customizer Filters */}
                        {selectedItem.type === "image" && (
                            <div className="space-y-3.5 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Image Filters</h4>
                                
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Blur Radius</span><span>{selectedItem.filter?.blur || 0}px</span></label>
                                    <input type="range" min="0" max="15" value={selectedItem.filter?.blur || 0} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, blur: parseInt(e.target.value) })} className={sliderCls} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Brightness</span><span>{selectedItem.filter?.brightness || 100}%</span></label>
                                    <input type="range" min="20" max="180" value={selectedItem.filter?.brightness || 100} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, brightness: parseInt(e.target.value) })} className={sliderCls} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Contrast</span><span>{selectedItem.filter?.contrast || 100}%</span></label>
                                    <input type="range" min="20" max="180" value={selectedItem.filter?.contrast || 100} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, contrast: parseInt(e.target.value) })} className={sliderCls} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Grayscale</span><span>{selectedItem.filter?.grayscale || 0}%</span></label>
                                    <input type="range" min="0" max="100" value={selectedItem.filter?.grayscale || 0} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, grayscale: parseInt(e.target.value) })} className={sliderCls} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Sepia</span><span>{selectedItem.filter?.sepia || 0}%</span></label>
                                    <input type="range" min="0" max="100" value={selectedItem.filter?.sepia || 0} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, sepia: parseInt(e.target.value) })} className={sliderCls} />
                                </div>

                                {/* Image Border Radius */}
                                <div className="pt-3 border-t border-white/5">
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Border Corners</span><span>{selectedItem.borderRadius || 0}px</span></label>
                                    <input type="range" min="0" max="100" value={selectedItem.borderRadius || 0} onChange={e => updateSelectedElement("borderRadius", parseInt(e.target.value))} className={sliderCls} />
                                </div>

                                {/* Canva-Style Quick Filters Presets */}
                                <div className="pt-4 border-t border-white/5 space-y-2.5">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Quick Effect Presets</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { name: "Original", id: "original" },
                                            { name: "Vintage", id: "vintage" },
                                            { name: "Mono", id: "mono" },
                                            { name: "Cyberpunk", id: "cyberpunk" },
                                            { name: "Dreamy", id: "dreamy" },
                                            { name: "Sunset", id: "sunset" },
                                            { name: "Nordic", id: "nordic" },
                                            { name: "Chrome", id: "chrome" },
                                            { name: "Vibrant", id: "vibrant" }
                                        ].map((effect) => (
                                            <button
                                                key={effect.id}
                                                onClick={() => applyImageEffectPreset(effect.id)}
                                                className="bg-[#1b1b1f] hover:bg-white/[0.04] border border-white/5 hover:border-accent/40 rounded-xl p-1 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 text-white/80"
                                            >
                                                <div className="w-full h-10 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
                                                    <img 
                                                        src={selectedItem.url} 
                                                        alt={effect.name} 
                                                        className="w-full h-full object-cover select-none pointer-events-none" 
                                                        style={getPresetFilterStyle(effect.id)}
                                                    />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-wider truncate max-w-full text-white/60">{effect.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shape configurations */}
                        {selectedItem.type === "shape" && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Vector Styles</h4>
                                
                                {/* Fill Type Toggle */}
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Fill Type</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => updateSelectedElement("fillType", "solid")}
                                            disabled={selectedItem.isLocked}
                                            className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                (selectedItem.fillType || "solid") === "solid"
                                                    ? "bg-accent text-accent-content"
                                                    : "bg-white/5 text-white/45 hover:bg-white/10"
                                            }`}
                                        >
                                            <i className="ri-paint-fill mr-1" />Solid
                                        </button>
                                        <button
                                            onClick={() => updateSelectedElement("fillType", "gradient")}
                                            disabled={selectedItem.isLocked}
                                            className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                selectedItem.fillType === "gradient"
                                                    ? "bg-accent text-accent-content"
                                                    : "bg-white/5 text-white/45 hover:bg-white/10"
                                            }`}
                                        >
                                            <i className="ri-contrast-drop-2-line mr-1" />Gradient
                                        </button>
                                    </div>
                                </div>

                                {/* Solid Fill */}
                                {(selectedItem.fillType || "solid") === "solid" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Fill Color</label>
                                            <input type="color" value={selectedItem.fill || "#ffffff"} onChange={e => updateSelectedElement("fill", e.target.value)} disabled={selectedItem.isLocked} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Color</label>
                                            <input type="color" value={selectedItem.stroke || "#000000"} onChange={e => updateSelectedElement("stroke", e.target.value)} disabled={selectedItem.isLocked} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" />
                                        </div>
                                    </div>
                                )}

                                {/* Gradient Fill */}
                                {selectedItem.fillType === "gradient" && (
                                    <div className="space-y-3.5 border-l border-white/10 pl-3">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Gradient Type</label>
                                            <select
                                                value={selectedItem.fillGradient?.type || "linear"}
                                                onChange={e => updateShapeFillGradient("type", e.target.value)}
                                                disabled={selectedItem.isLocked}
                                                className={inputCls}
                                            >
                                                <option value="linear">Linear</option>
                                                <option value="radial">Radial</option>
                                                <option value="conic">Conic</option>
                                            </select>
                                        </div>
                                        {selectedItem.fillGradient?.type === "linear" && (
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Direction</label>
                                                <select value={selectedItem.fillGradient?.direction || "to-r"} onChange={e => updateShapeFillGradient("direction", e.target.value)} disabled={selectedItem.isLocked} className={inputCls}>
                                                    <option value="to-r">Left → Right</option>
                                                    <option value="to-b">Top → Bottom</option>
                                                    <option value="to-tr">Top Right Diagonal</option>
                                                </select>
                                            </div>
                                        )}
                                        {selectedItem.fillGradient?.type === "conic" && (
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Conic Angle</label>
                                                <input type="text" value={selectedItem.fillGradient?.conicAngle || "0deg"} onChange={e => updateShapeFillGradient("conicAngle", e.target.value)} disabled={selectedItem.isLocked} className={inputCls} placeholder="e.g. 45deg" />
                                            </div>
                                        )}

                                        {/* Gradient Track */}
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Color Stops</label>
                                            <div
                                                onClick={(e) => {
                                                    if (selectedItem.isLocked || e.target !== e.currentTarget) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                                                    addShapeGradientStop(percent, "#ffffff");
                                                }}
                                                className="h-6 rounded-lg relative cursor-pointer border border-white/10 shadow-inner"
                                                style={{
                                                    background: `linear-gradient(to right, ${getShapeFillGradientStops().map(s => `${s.color} ${s.offset}%`).join(", ")})`
                                                }}
                                            >
                                                                                {getShapeFillGradientStops().map((stop, idx) => (
                                                    <div
                                                        key={idx}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            const startX = e.clientX;
                                                            const startOff = stop.offset;
                                                            const trackEl = e.currentTarget.parentElement;
                                                            if (!trackEl) return;
                                                            const trackRect = trackEl.getBoundingClientRect();
                                                            
                                                            const move = (me) => {
                                                                let newOff = Math.round(startOff + ((me.clientX - startX) / trackRect.width) * 100);
                                                                newOff = Math.max(0, Math.min(100, newOff));
                                                                updateShapeGradientStop(idx, "offset", newOff);
                                                            };
                                                            const up = () => {
                                                                document.removeEventListener("mousemove", move);
                                                                document.removeEventListener("mouseup", up);
                                                            };
                                                            document.addEventListener("mousemove", move);
                                                            document.addEventListener("mouseup", up);
                                                        }}
                                                        onDoubleClick={(e) => { e.stopPropagation(); removeShapeGradientStop(idx); }}
                                                        className="w-3.5 h-6 bg-white border-2 border-accent rounded-md absolute -translate-x-1/2 cursor-ew-resize flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                                                        style={{ left: `${stop.offset}%` }}
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stop.color }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[7px] text-white/25 mt-1">Click track to add stop. Drag stop left/right. Double-click to delete.</p>
                                            <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto popup-custom-scrollbar pr-0.5">
                                                {getShapeFillGradientStops().map((stop, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        draggable={!selectedItem.isLocked}
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("text/plain", idx);
                                                        }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const dragIdx = parseInt(e.dataTransfer.getData("text/plain"));
                                                            const dropIdx = idx;
                                                            if (dragIdx === dropIdx) return;
                                                            
                                                            const currentStops = [...getShapeFillGradientStops()];
                                                            const tempColor = currentStops[dragIdx].color;
                                                            currentStops[dragIdx].color = currentStops[dropIdx].color;
                                                            currentStops[dropIdx].color = tempColor;
                                                            
                                                            updateShapeFillGradient("stops", currentStops);
                                                        }}
                                                        className="flex items-center gap-1.5 bg-[#1b1b1f] border border-white/5 p-1.5 rounded-xl text-[10px] cursor-grab active:cursor-grabbing hover:bg-white/[0.02]"
                                                    >
                                                        <i className="ri-drag-drop-line text-white/30 cursor-grab" />
                                                        <input type="color" value={stop.color} onChange={e => updateShapeGradientStop(idx, "color", e.target.value)} disabled={selectedItem.isLocked} className="w-6 h-5 rounded cursor-pointer border border-white/5 bg-transparent" />
                                                        <input type="text" value={stop.color} onChange={e => updateShapeGradientStop(idx, "color", e.target.value)} disabled={selectedItem.isLocked} className="flex-1 bg-transparent border border-white/10 rounded px-1 py-0.5 outline-none font-mono text-[9px] text-white" />
                                                        <span className="text-white/30 font-mono text-[8px]">{stop.offset}%</span>
                                                        {getShapeFillGradientStops().length > 2 && (
                                                            <button onClick={() => removeShapeGradientStop(idx)} className="w-4 h-4 flex items-center justify-center hover:bg-red-500 text-red-400 hover:text-white rounded transition-all cursor-pointer"><i className="ri-close-line text-[9px]" /></button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stroke alongside gradient */}
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Color</label>
                                            <input type="color" value={selectedItem.stroke || "#000000"} onChange={e => updateSelectedElement("stroke", e.target.value)} disabled={selectedItem.isLocked} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent disabled:opacity-40" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Width (px)</label>
                                    <input type="number" value={selectedItem.strokeWidth || 0} onChange={e => updateSelectedElement("strokeWidth", parseInt(e.target.value) || 0)} disabled={selectedItem.isLocked} className={inputCls} />
                                </div>

                                {selectedItem.shapeType === "rect" && (
                                    <div>
                                        <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Border Corners</span><span>{selectedItem.borderRadius || 0}px</span></label>
                                        <input type="range" min="0" max="100" value={selectedItem.borderRadius || 0} onChange={e => updateSelectedElement("borderRadius", parseInt(e.target.value))} disabled={selectedItem.isLocked} className={sliderCls} />
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between text-[8px] font-bold text-white/45 mb-1">
                                        <span>Layer Blur (Figma Glow)</span>
                                        <span>{selectedItem.blur || 0}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1000" 
                                        value={selectedItem.blur || 0} 
                                        onChange={e => updateSelectedElement("blur", parseInt(e.target.value))} 
                                        disabled={selectedItem.isLocked}
                                        className={sliderCls} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Drop Shadow Filter Properties */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Drop Shadows</h4>
                            
                            <div>
                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Shadow Blur</span><span>{selectedItem.shadowBlur || 0}px</span></label>
                                <input type="range" min="0" max="50" value={selectedItem.shadowBlur || 0} onChange={e => updateSelectedElement("shadowBlur", parseInt(e.target.value))} className={sliderCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8px] font-bold text-white/35 block mb-1">Offset X</label>
                                    <input type="number" value={selectedItem.shadowX || 0} onChange={e => updateSelectedElement("shadowX", parseInt(e.target.value) || 0)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-white/35 block mb-1">Offset Y</label>
                                    <input type="number" value={selectedItem.shadowY || 0} onChange={e => updateSelectedElement("shadowY", parseInt(e.target.value) || 0)} className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Shadow Color</label>
                                <input type="color" value={selectedItem.shadowColor || "#000000"} onChange={e => updateSelectedElement("shadowColor", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Poster Sizing / Background Config / Redirection (Default Panel) */
                <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-white/5 pb-2">Poster Configuration</h3>

                    {/* Canvas Size aspect ratio selector */}
                    <div>
                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Aspect Ratio / Size</label>
                        <select 
                            value={canvasSizes.find(s => s.width === canvasWidth && s.height === canvasHeight)?.name || ""}
                            onChange={e => handleSelectSizePreset(e.target.value)}
                            className={inputCls}
                        >
                            <option value="" disabled>Custom Sizing</option>
                            {canvasSizes.map((s, idx) => (
                                <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <label className="text-[8px] font-bold text-white/30 block mb-0.5">W (px)</label>
                                <input 
                                    type="number" 
                                    value={canvasWidth} 
                                    onChange={e => {
                                        const w = parseInt(e.target.value) || 100;
                                        setCanvasWidth(w);
                                        saveToLocalStorage(elements, canvasBg, borderRadius, title, linkUrl, w, canvasHeight, displayTime);
                                    }} 
                                    className={inputCls} 
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-white/30 block mb-0.5">H (px)</label>
                                <input 
                                    type="number" 
                                    value={canvasHeight} 
                                    onChange={e => {
                                        const h = parseInt(e.target.value) || 100;
                                        setCanvasHeight(h);
                                        saveToLocalStorage(elements, canvasBg, borderRadius, title, linkUrl, canvasWidth, h, displayTime);
                                    }} 
                                    className={inputCls} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Auto-Dismiss Duration Configuration */}
                    <div>
                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Display Time (Seconds)</label>
                        <input 
                            type="number" 
                            min="2" 
                            max="60"
                            value={displayTime} 
                            onChange={e => {
                                const val = Math.max(2, parseInt(e.target.value) || 5);
                                setDisplayTime(val);
                                saveToLocalStorage(elements, canvasBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight, val);
                            }}
                            className={inputCls}
                            placeholder="e.g. 5 seconds"
                        />
                        <span className="text-[8px] text-white/35 font-bold uppercase mt-1 block">* Determines how long the popup stays open before auto-closing.</span>
                    </div>

                    {/* Background Picker */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Background Type</label>
                            <select 
                                value={canvasBg.type} 
                                onChange={e => updateBgKey("type", e.target.value)} 
                                className={inputCls}
                            >
                                <option value="solid">Solid Background</option>
                                <option value="linear">Linear Gradient</option>
                                <option value="radial">Radial Gradient</option>
                                <option value="conic">Conical Gradient</option>
                                <option value="mesh">Mesh Gradient (Multicolor)</option>
                            </select>
                        </div>

                        {/* Background stops and colors */}
                        <div className="space-y-3.5 pt-1">
                            {canvasBg.type === "solid" ? (
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Solid Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={canvasBg.color1} onChange={e => updateBgKey("color1", e.target.value)} className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                        <input type="text" value={canvasBg.color1} onChange={e => updateBgKey("color1", e.target.value)} className={inputCls} />
                                    </div>
                                </div>
                            ) : canvasBg.type === "mesh" ? (
                                <div className="space-y-4 border-l border-white/10 pl-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black uppercase text-white/45">Mesh Color Nodes</label>
                                        <button 
                                            onClick={handleAddMeshPoint}
                                            className="px-2 py-1 bg-accent/20 hover:bg-accent/35 text-accent text-[8px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                                            title="Place a new color dot in center"
                                        >
                                            + Add Color
                                        </button>
                                    </div>

                                    {/* Mesh Color Node selector */}
                                    <div className="space-y-2.5">
                                        <div>
                                            <label className="text-[8px] font-bold text-white/30 block mb-1">Select Point</label>
                                            <select
                                                value={activeMeshPtId}
                                                onChange={e => setSelectedMeshPointId(e.target.value)}
                                                className={inputCls}
                                            >
                                                {points.map((p, idx) => (
                                                    <option key={p.id || idx} value={p.id || idx}>Node {idx + 1} ({p.x}%, {p.y}%)</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[8px] font-bold text-white/35 block mb-1">Node Color</label>
                                                <input 
                                                    type="color" 
                                                    value={activeMeshPt?.color || "#ffffff"} 
                                                    onChange={e => handleUpdateMeshPoint(activeMeshPtId, "color", e.target.value)} 
                                                    className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/35 block mb-0.5">Spread / Spread (px)</label>
                                                <input 
                                                    type="number"
                                                    value={activeMeshPt?.radius || 65}
                                                    onChange={e => handleUpdateMeshPoint(activeMeshPtId, "radius", parseInt(e.target.value) || 10)}
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[8px] font-bold text-white/35 mb-1">
                                                <span>Gradient Radius / Radius</span>
                                                <span>{activeMeshPt?.radius || 65}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="180"
                                                value={activeMeshPt?.radius || 65}
                                                onChange={e => handleUpdateMeshPoint(activeMeshPtId, "radius", parseInt(e.target.value))}
                                                className={sliderCls}
                                            />
                                        </div>

                                        {points.length > 2 && (
                                            <button 
                                                onClick={() => handleRemoveMeshPoint(activeMeshPtId)}
                                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                                                title="Remove this color point"
                                            >
                                                Delete Color Point
                                            </button>
                                        )}

                                        {/* Mesh Node Z-Order Controls */}
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[8px] font-black uppercase text-white/30 block">Layer Order</span>
                                            <div className="grid grid-cols-4 gap-1">
                                                <button
                                                    onClick={() => handleMoveMeshPointBack && handleMoveMeshPointBack(activeMeshPtId)}
                                                    title="Send node to back (renders underneath all others)"
                                                    className="flex flex-col items-center justify-center p-1 bg-[#1b1b1f] hover:bg-accent/20 hover:text-accent text-white/50 text-[8px] font-black rounded-lg cursor-pointer transition-all"
                                                >
                                                    <i className="ri-skip-down-line text-xs" />
                                                    <span className="mt-0.5">Back</span>
                                                </button>
                                                <button
                                                    onClick={() => handleMoveMeshPointDown && handleMoveMeshPointDown(activeMeshPtId)}
                                                    title="Move node down/backward"
                                                    className="flex flex-col items-center justify-center p-1 bg-[#1b1b1f] hover:bg-accent/20 hover:text-accent text-white/50 text-[8px] font-black rounded-lg cursor-pointer transition-all"
                                                >
                                                    <i className="ri-arrow-down-s-line text-xs" />
                                                    <span className="mt-0.5">Down</span>
                                                </button>
                                                <button
                                                    onClick={() => handleMoveMeshPointUp && handleMoveMeshPointUp(activeMeshPtId)}
                                                    title="Move node up/forward"
                                                    className="flex flex-col items-center justify-center p-1 bg-[#1b1b1f] hover:bg-accent/20 hover:text-accent text-white/50 text-[8px] font-black rounded-lg cursor-pointer transition-all"
                                                >
                                                    <i className="ri-arrow-up-s-line text-xs" />
                                                    <span className="mt-0.5">Up</span>
                                                </button>
                                                <button
                                                    onClick={() => handleMoveMeshPointFront && handleMoveMeshPointFront(activeMeshPtId)}
                                                    title="Bring node to front (renders on top of all others)"
                                                    className="flex flex-col items-center justify-center p-1 bg-[#1b1b1f] hover:bg-accent/20 hover:text-accent text-white/50 text-[8px] font-black rounded-lg cursor-pointer transition-all"
                                                >
                                                    <i className="ri-skip-up-line text-xs" />
                                                    <span className="mt-0.5">Front</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-white/30 leading-normal font-bold uppercase tracking-wider">* Drag mesh points directly inside the canvas to shift colors.</p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {canvasBg.type === "linear" && (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Flow Direction</label>
                                            <select value={canvasBg.direction} onChange={e => updateBgKey("direction", e.target.value)} className={inputCls}>
                                                <option value="to-r">Left to Right</option>
                                                <option value="to-b">Top to Bottom</option>
                                                <option value="to-tr">Top Right Diagonal</option>
                                            </select>
                                        </div>
                                    )}

                                    {canvasBg.type === "conic" && (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Conic Angle</label>
                                            <input type="text" value={canvasBg.conicAngle || "0deg"} onChange={e => updateBgKey("conicAngle", e.target.value)} className={inputCls} placeholder="e.g. 45deg" />
                                        </div>
                                    )}

                                    {/* Color stops sub-slider render */}
                                    <div className="space-y-3 pt-2">
                                        <label className="text-[9px] font-black uppercase text-white/45">Gradient Color Stops</label>
                                        
                                        <div 
                                            onClick={(e) => {
                                                if (e.target !== e.currentTarget) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                                                addGradientStop(percent, "#ffffff");
                                            }}
                                            className="h-6 rounded-lg relative cursor-pointer border border-white/10 shadow-inner"
                                            style={{
                                                background: `linear-gradient(to right, ${getStops().map(s => `${s.color} ${s.offset}%`).join(", ")})`
                                            }}
                                            title="Click track to add stop"
                                        >
                                            {getStops().map((stop, idx) => (
                                                <div
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        const capturedStartX = e.clientX;
                                                        const capturedOffset = stop.offset;
                                                        const capturedIdx = idx;
                                                        const trackDom = e.currentTarget.parentElement;
                                                        if (!trackDom) return;
                                                        const trackRect = trackDom.getBoundingClientRect();
                                                        
                                                        const handleStopMove = (moveEvent) => {
                                                            const dx = moveEvent.clientX - capturedStartX;
                                                            let newOffset = Math.round(capturedOffset + (dx / trackRect.width) * 100);
                                                            newOffset = Math.max(0, Math.min(100, newOffset));
                                                            // Update without re-sorting during drag (prevents jumpy behavior)
                                                            const currentStops = getStops(canvasBgRef.current);
                                                            const updatedStops = currentStops.map((s, i) => i === capturedIdx ? { ...s, offset: newOffset } : s);
                                                            const updatedBg = { ...canvasBgRef.current, stops: updatedStops };
                                                            setCanvasBg(updatedBg);
                                                        };
                                                        
                                                        const handleStopUp = () => {
                                                            document.removeEventListener("mousemove", handleStopMove);
                                                            document.removeEventListener("mouseup", handleStopUp);
                                                            // Sort only on release
                                                            pushToHistoryState(elements, canvasBgRef.current);
                                                        };
                                                        
                                                        document.addEventListener("mousemove", handleStopMove);
                                                        document.addEventListener("mouseup", handleStopUp);
                                                    }}
                                                    className="w-3.5 h-6 bg-white border-2 border-accent rounded-md absolute -translate-x-1/2 cursor-ew-resize flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                                                    style={{ left: `${stop.offset}%` }}
                                                    title="Drag left/right to slide. Double-click to delete."
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        removeGradientStop(idx);
                                                    }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stop.color }} />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <p className="text-[8px] text-white/30 leading-normal font-bold uppercase tracking-wider mt-1">* Click track to add stop. Drag stop to slide. Double-click stop to delete.</p>
                                        
                                        <div className="space-y-2 max-h-40 overflow-y-auto popup-custom-scrollbar pr-1">
                                            {getStops().map((stop, idx) => (
                                                <div 
                                                    key={idx} 
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData("text/plain", idx);
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const dragIdx = parseInt(e.dataTransfer.getData("text/plain"));
                                                        const dropIdx = idx;
                                                        if (dragIdx === dropIdx) return;
                                                        
                                                        const currentStops = [...getStops()];
                                                        const tempColor = currentStops[dragIdx].color;
                                                        currentStops[dragIdx].color = currentStops[dropIdx].color;
                                                        currentStops[dropIdx].color = tempColor;
                                                        
                                                        const updatedBg = { ...canvasBg, stops: currentStops };
                                                        setCanvasBg(updatedBg);
                                                        saveToLocalStorage(elements, updatedBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
                                                        pushToHistoryState(elements, updatedBg);
                                                    }}
                                                    className="flex items-center gap-1.5 bg-[#1b1b1f] border border-white/5 p-2 rounded-xl text-[10px] cursor-grab active:cursor-grabbing hover:bg-white/[0.02]"
                                                >
                                                    <i className="ri-drag-drop-line text-white/30 cursor-grab" />
                                                    <span className="font-bold text-white/45 w-12 truncate">Stop {idx + 1} ({stop.offset}%)</span>
                                                    <input 
                                                        type="color" 
                                                        value={stop.color} 
                                                        onChange={(e) => updateGradientStop(idx, "color", e.target.value)} 
                                                        className="w-7 h-5 rounded cursor-pointer border border-white/5 bg-transparent" 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={stop.color} 
                                                        onChange={(e) => updateGradientStop(idx, "color", e.target.value)} 
                                                        className="flex-1 bg-background/50 border border-white/10 rounded px-1.5 py-0.5 outline-none font-mono text-[9px] text-white" 
                                                    />
                                                    {getStops().length > 2 && (
                                                        <button 
                                                            onClick={() => removeGradientStop(idx)} 
                                                            className="w-5 h-5 flex items-center justify-center bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded transition-all cursor-pointer"
                                                            title="Delete stop"
                                                        >
                                                            <i className="ri-delete-bin-6-line text-[10px]" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Grain Overlay control */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between text-[9px] font-black uppercase text-white/45 mb-1.5">
                            <span>SVG Noise / Grain</span>
                            <span className="font-mono text-accent">{canvasBg.grainOpacity ?? 0}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={canvasBg.grainOpacity ?? 0} 
                            onChange={e => updateBgKey("grainOpacity", parseInt(e.target.value))} 
                            className={sliderCls} 
                        />
                    </div>

                    {/* Border Radius Customizer */}
                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Canvas Border Corners</label>
                        <select 
                            value={borderRadius} 
                            onChange={e => {
                                setBorderRadius(e.target.value);
                                saveToLocalStorage(elements, canvasBg, e.target.value, title, linkUrl, canvasWidth, canvasHeight, displayTime);
                            }} 
                            className={inputCls}
                        >
                            <option value="none">Sharp / No Corners</option>
                            <option value="md">Slightly Rounded</option>
                            <option value="lg">Rounded</option>
                            <option value="2xl">Very Rounded</option>
                            <option value="full">Pill Modals</option>
                        </select>
                    </div>

                    {/* Clip Content Toggle */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div>
                            <label htmlFor="clipContentToggle" className="text-[9px] font-black uppercase text-white/45 block cursor-pointer select-none">Clip Content</label>
                            <span className="text-[8px] text-white/30 font-medium">Overflow hidden for children</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="clipContentToggle"
                                checked={clipContent} 
                                onChange={e => setClipContent(e.target.checked)} 
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#1b1b1f] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/80 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
                        </label>
                    </div>

                    {/* Redirection Link */}
                    <div className="border-t border-white/5 pt-4">
                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Action Redirect Link</label>
                        <input 
                            value={linkUrl} 
                            onChange={e => {
                                setLinkUrl(e.target.value);
                                saveToLocalStorage(elements, canvasBg, borderRadius, title, e.target.value, canvasWidth, canvasHeight, displayTime);
                            }} 
                            className={inputCls} 
                            placeholder="e.g. /shop or /products/ID" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightSidebar;
