import React, { useRef } from "react";

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
    handleUpdateMeshPoint
}) => {
    const inputCls = "w-full bg-[#1b1b1f] border border-white/10 focus:border-accent rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-medium";
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

    return (
        <div className="w-80 bg-[#18181c] border-l border-white/5 overflow-y-auto p-5 space-y-6 flex flex-col h-full text-white select-none">
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

                    {/* Quick Align relative to dynamic canvas bounds */}
                    {!selectedItem.isLocked && (
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
                    )}

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
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Fill Color</label>
                                    <input type="color" value={selectedItem.fill || "#ffffff"} onChange={e => updateSelectedElement("fill", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Color</label>
                                    <input type="color" value={selectedItem.stroke || "#000000"} onChange={e => updateSelectedElement("stroke", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Width (px)</label>
                                <input type="number" value={selectedItem.strokeWidth || 0} onChange={e => updateSelectedElement("strokeWidth", parseInt(e.target.value) || 0)} className={inputCls} />
                            </div>

                            {selectedItem.shapeType === "rect" && (
                                <div>
                                    <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Border Corners</span><span>{selectedItem.borderRadius || 0}px</span></label>
                                    <input type="range" min="0" max="100" value={selectedItem.borderRadius || 0} onChange={e => updateSelectedElement("borderRadius", parseInt(e.target.value))} className={sliderCls} />
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
                                    max="500" 
                                    value={selectedItem.blur || 0} 
                                    onChange={e => updateSelectedElement("blur", parseInt(e.target.value))} 
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
                                <label className="text-[8px] font-bold text-white/45 block mb-1">Offset X (px)</label>
                                <input type="number" value={selectedItem.shadowX || 0} onChange={e => updateSelectedElement("shadowX", parseInt(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-white/45 block mb-1">Offset Y (px)</label>
                                <input type="number" value={selectedItem.shadowY || 0} onChange={e => updateSelectedElement("shadowY", parseInt(e.target.value) || 0)} className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Shadow Color</label>
                            <input type="color" value={selectedItem.shadowColor || "#000000"} onChange={e => updateSelectedElement("shadowColor", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
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
                                                        dragInfo.current = {
                                                            isDraggingStop: true,
                                                            stopIndex: idx,
                                                            startX: e.clientX,
                                                            startOffset: stop.offset
                                                        };
                                                        
                                                        const handleStopMove = (moveEvent) => {
                                                            const info = dragInfo.current;
                                                            if (!info.isDraggingStop) return;
                                                            
                                                            const trackDom = e.currentTarget.parentElement;
                                                            const trackRect = trackDom.getBoundingClientRect();
                                                            const dx = moveEvent.clientX - info.startX;
                                                            let newOffset = Math.round(info.startOffset + (dx / trackRect.width) * 100);
                                                            newOffset = Math.max(0, Math.min(100, newOffset));
                                                            
                                                            updateGradientStop(info.stopIndex, "offset", newOffset);
                                                        };
                                                        
                                                        const handleStopUp = () => {
                                                            document.removeEventListener("mousemove", handleStopMove);
                                                            document.removeEventListener("mouseup", handleStopUp);
                                                            pushToHistoryState(elements, canvasBgRef.current);
                                                        };
                                                        
                                                        document.addEventListener("mousemove", handleStopMove);
                                                        document.addEventListener("mouseup", handleStopUp);
                                                    }}
                                                    className="w-3.5 h-6 bg-white border-2 border-accent rounded-md absolute -translate-x-1/2 cursor-ew-resize flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                                                    style={{ left: `${stop.offset}%` }}
                                                    title="Drag to slide. Double-click to delete."
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
                                        
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {getStops().map((stop, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-[#1b1b1f] border border-white/5 p-2 rounded-xl text-[10px]">
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
