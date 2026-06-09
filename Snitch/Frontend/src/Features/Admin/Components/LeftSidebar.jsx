import React from "react";
import { PRESET_SHAPES, PRESET_GRADIENTS, TEXT_PRESETS } from "./CanvasPresets";

const LeftSidebar = ({
    elements,
    selectedId,
    setSelectedId,
    canvasBg,
    setCanvasBg,
    activeSidebarTab,
    setActiveSidebarTab,
    updateSelectedElementState,
    handleDeleteElementById,
    moveZIndex,
    handleAddTextPreset,
    handleAddShape,
    applyPresetGradient,
    addGradientStop,
    updateGradientStop,
    removeGradientStop,
    getStops,
    getCanvasBackgroundCSS,
    imageLinkInput,
    setImageLinkInput,
    handleAddImageLink,
    pushToHistoryState,
    elementsRef,
    canvasBgRef
}) => {
    const inputCls = "w-full bg-[#1b1b1f] border border-white/10 focus:border-accent rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-medium";

    return (
        <div className="w-80 bg-[#18181c] border-r border-white/5 flex flex-col h-full overflow-hidden">
            {/* Sidebar Tab headers */}
            <div className="grid grid-cols-4 border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-center flex-shrink-0">
                <button 
                    onClick={() => setActiveSidebarTab("assets")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeSidebarTab === "assets" ? "border-accent text-white bg-white/[0.02]" : "border-transparent text-white/45 hover:text-white"}`}
                >
                    <i className="ri-shapes-line text-sm block mb-1" /> Assets
                </button>
                <button 
                    onClick={() => setActiveSidebarTab("presets")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeSidebarTab === "presets" ? "border-accent text-white bg-white/[0.02]" : "border-transparent text-white/45 hover:text-white"}`}
                >
                    <i className="ri-palette-line text-sm block mb-1" /> Gradients
                </button>
                <button 
                    onClick={() => setActiveSidebarTab("layers")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeSidebarTab === "layers" ? "border-accent text-white bg-white/[0.02]" : "border-transparent text-white/45 hover:text-white"}`}
                >
                    <i className="ri-stack-line text-sm block mb-1" /> Layers
                </button>
                <button 
                    onClick={() => setActiveSidebarTab("uploads")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeSidebarTab === "uploads" ? "border-accent text-white bg-white/[0.02]" : "border-transparent text-white/45 hover:text-white"}`}
                >
                    <i className="ri-upload-2-line text-sm block mb-1" /> Media
                </button>
            </div>

            {/* Left Sidebar Content panes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSidebarTab === "layers" && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Canvas Layers</h3>
                            <span className="text-[9px] text-white/40">{elements.length} Element{elements.length !== 1 ? "s" : ""}</span>
                        </div>
                        
                        {elements.length === 0 ? (
                            <div className="py-12 text-center text-white/20 text-xs flex flex-col items-center gap-2 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                <i className="ri-stack-line text-2xl" />
                                <span>No layers active. Add text, shapes, or images.</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {[...elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => {
                                    const isSel = el.id === selectedId;
                                    const icon = el.type === "text" ? "ri-text" : el.type === "image" ? "ri-image-line" : "ri-shapes-line";
                                    
                                    return (
                                        <div 
                                            key={el.id}
                                            onClick={() => setSelectedId(el.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer group border
                                                ${isSel 
                                                    ? "bg-accent/10 border-accent/35 text-white" 
                                                    : "bg-[#1b1b1f] border-transparent hover:bg-white/[0.03] text-white/70"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <i className={`${icon} flex-shrink-0 text-accent`} />
                                                <span className="truncate font-medium text-[11px] block">
                                                    {el.type === "text" ? el.content.substring(0, 18) || "Text Frame" : el.name || el.type}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateSelectedElementState(el.id, "isLocked", !el.isLocked);
                                                    }}
                                                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-white"
                                                    title={el.isLocked ? "Unlock layer" : "Lock layer"}
                                                >
                                                    <i className={el.isLocked ? "ri-lock-fill text-accent" : "ri-lock-unlock-line"} />
                                                </button>
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateSelectedElementState(el.id, "hidden", !el.hidden);
                                                    }}
                                                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-white"
                                                    title={el.hidden ? "Show layer" : "Hide layer"}
                                                >
                                                    <i className={el.hidden ? "ri-eye-off-line text-white/50" : "ri-eye-line"} />
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteElementById(el.id);
                                                    }}
                                                    className="w-5 h-5 rounded hover:bg-red-500/20 flex items-center justify-center text-red-400"
                                                    title="Delete Layer"
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeSidebarTab === "assets" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2.5">Text Styles</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {TEXT_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddTextPreset(preset)}
                                        style={{ fontFamily: preset.fontFamily }}
                                        className="p-3 bg-[#1b1b1f] border border-white/5 rounded-xl text-center text-xs hover:border-accent hover:bg-white/[0.02] active:scale-95 transition-all text-white font-bold cursor-pointer"
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2.5">Shapes Library</h3>
                            <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                                {Object.keys(PRESET_SHAPES).map((shapeKey) => {
                                    const s = PRESET_SHAPES[shapeKey];
                                    return (
                                        <button
                                            key={shapeKey}
                                            onClick={() => handleAddShape(shapeKey)}
                                            className="p-2 bg-[#1b1b1f] border border-white/5 rounded-xl hover:border-accent hover:bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center text-[8px] font-bold text-white/70"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded">
                                                {s.shapeType === "rect" && <div className="w-4 h-4 bg-white/45" />}
                                                {s.shapeType === "circle" && <div className="w-4 h-4 rounded-full bg-white/45" />}
                                                {s.shapeType === "polygon" && (
                                                    <svg className="w-4 h-4 text-white/45" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        <polygon points={s.points} fill="currentColor" />
                                                    </svg>
                                                )}
                                                {s.shapeType === "path" && (
                                                    <svg className="w-4 h-4 text-white/45" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        <path d={s.path} fill="currentColor" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="truncate max-w-[50px]">{s.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeSidebarTab === "presets" && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Gradient Presets</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {PRESET_GRADIENTS.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyPresetGradient(p)}
                                    className="h-16 rounded-xl border border-white/5 hover:border-accent transition-all cursor-pointer relative overflow-hidden text-left p-2 flex flex-col justify-end shadow-md"
                                    style={{ background: getCanvasBackgroundCSS(p) }}
                                >
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-black/60 px-1.5 py-0.5 rounded text-white backdrop-blur-sm shadow">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeSidebarTab === "uploads" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5">Insert Web Graphic</h3>
                            <div className="flex gap-2">
                                <input 
                                    value={imageLinkInput} 
                                    onChange={e => setImageLinkInput(e.target.value)} 
                                    className={inputCls} 
                                    placeholder="Paste Image URL..." 
                                />
                                <button 
                                    onClick={() => handleAddImageLink()}
                                    className="px-3 bg-accent text-accent-content hover:bg-accent/95 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                            <p className="text-[8px] text-white/45 mt-1.5 leading-normal">* Or click the Add Image file uploader in the top toolbar to overlay a graphic from your local file system.</p>
                        </div>

                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Used In Campaign</h3>
                            {(() => {
                                const canvasImages = elements.filter(el => el.type === "image" && el.url);
                                if (canvasImages.length === 0) {
                                    return (
                                        <div className="py-6 text-center text-white/20 text-[10px] border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                            No images added to this canvas yet.
                                        </div>
                                    );
                                }
                                return (
                                    <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                                        {canvasImages.map((el, index) => (
                                            <div 
                                                key={el.id || index}
                                                className="group relative h-20 rounded-xl bg-[#1b1b1f] border border-white/5 hover:border-accent overflow-hidden transition-all cursor-pointer shadow-md"
                                                onClick={() => handleAddImageLink(el.url)}
                                                title="Click to add another copy"
                                            >
                                                <img 
                                                    src={el.url} 
                                                    alt="uploaded asset" 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none" 
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-white bg-accent/90 px-1.5 py-0.5 rounded shadow-sm">
                                                        Add Copy
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;
