import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { usePopup } from "../Hooks/usePopup";
import { PrimaryBtn, SecondaryBtn } from "../../Components/Buttons";
import Modal from "../../Components/Modal";
import PageLoader from "../../Components/PageLoader";
import { AdminTaxonomySkeleton } from "../../Components/Skeletons";
import html2canvas from "html2canvas";

const AdminPopupsPage = () => {
    const inputCls = "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-3 py-2 text-xs outline-none transition-all font-medium";
    const sliderCls = "w-full accent-accent bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer";
    const { allPopups, loading } = useSelector((state) => state.popup);
    const {
        fetchAllPopups,
        handleCreatePopup,
        handleUpdatePopup,
        handleDeletePopup,
        handleTogglePopupActive,
    } = usePopup();

    // Canvas settings
    const canvasRef = useRef(null);
    const [canvasBg, setCanvasBg] = useState({
        type: "solid", // solid, linear, radial, conic, mesh
        color1: "#111111",
        color2: "#333333",
        color3: "#4f46e5", // used for mesh corners
        color4: "#db2777", // used for mesh corners
        direction: "to-r", // linear directions
        conicAngle: "0deg",
    });

    // Editor state
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [title, setTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [size, setSize] = useState("md"); // sm, md, lg, xl, full
    const [borderRadius, setBorderRadius] = useState("2xl");
    const [editItem, setEditItem] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    // Pen Tool / Custom SVG Drawing state
    const [isPenMode, setIsPenMode] = useState(false);
    const [penPoints, setPenPoints] = useState([]);

    // Drag / Resize / Selection logic refs
    const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, elementX: 0, elementY: 0, elementW: 0, elementH: 0 });

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [imageLinkInput, setImageLinkInput] = useState("");
    const [loadedFonts, setLoadedFonts] = useState(new Set(["Inter"]));

    useEffect(() => {
        fetchAllPopups();
    }, []);

    // Load Google Fonts on the fly
    const loadGoogleFont = (fontName) => {
        if (loadedFonts.has(fontName)) return;
        
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;500;700;900&display=swap`;
        document.head.appendChild(link);
        
        setLoadedFonts(prev => new Set([...prev, fontName]));
    };

    const popularFonts = [
        "Inter", "Roboto", "Outfit", "Playfair Display", "Montserrat", 
        "Cinzel", "Pacifico", "Bungee", "Righteous", "Syne", "Cabinet Grotesk"
    ];

    // Background compilation helper
    const getCanvasBackgroundCSS = (bg = canvasBg) => {
        if (bg.type === "solid") return bg.color1;
        if (bg.type === "linear") {
            return `linear-gradient(${bg.direction === "radial" || bg.direction === "to-b" ? "to bottom" : bg.direction === "to-tr" ? "to top right" : "to right"}, ${bg.color1}, ${bg.color2})`;
        }
        if (bg.type === "radial") {
            return `radial-gradient(circle, ${bg.color1}, ${bg.color2})`;
        }
        if (bg.type === "conic") {
            return `conic-gradient(from ${bg.conicAngle} at 50% 50%, ${bg.color1}, ${bg.color2}, ${bg.color1})`;
        }
        if (bg.type === "mesh") {
            return `radial-gradient(at 0% 0%, ${bg.color1} 0px, transparent 55%),
                    radial-gradient(at 100% 0%, ${bg.color2} 0px, transparent 55%),
                    radial-gradient(at 100% 100%, ${bg.color3} 0px, transparent 55%),
                    radial-gradient(at 0% 100%, ${bg.color4} 0px, transparent 55%)`;
        }
        return bg.color1;
    };

    // Initialize Canvas from existing popup model metadata
    const handleEditCampaign = (item) => {
        setEditItem(item);
        setTitle(item.title);
        setLinkUrl(item.linkUrl || "");
        setSize(item.size || "md");
        setBorderRadius(item.borderRadius || "2xl");

        // Hydrate background
        const isGrad = item.isGradient || false;
        setCanvasBg({
            type: isGrad ? "linear" : "solid",
            color1: item.backgroundColor || "#111111",
            color2: item.gradientColor || "#333333",
            color3: "#4f46e5",
            color4: "#db2777",
            direction: item.gradientDirection || "to-r",
            conicAngle: "0deg"
        });

        // Parse layers if any exist, otherwise create a single layer representing the legacy content
        let initialElements = [];
        
        // Check if item has multiple layers saved (encoded as JSON inside text field or stored as a draft configuration)
        // If it's a legacy popup, reconstruct its structure as separate layers
        if (item.text || item.imageUrl) {
            let z = 1;
            if (item.imageUrl) {
                initialElements.push({
                    id: "legacy-image",
                    type: "image",
                    url: item.imageUrl,
                    x: 20,
                    y: 20,
                    width: 340,
                    height: 200,
                    zIndex: z++,
                    isLocked: false,
                    filter: item.imageFilter || { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 }
                });
            }
            if (item.text) {
                initialElements.push({
                    id: "legacy-text",
                    type: "text",
                    content: item.text,
                    x: 20,
                    y: item.imageUrl ? 240 : 150,
                    width: 340,
                    height: 120,
                    zIndex: z++,
                    isLocked: false,
                    fontFamily: "Outfit",
                    fontSize: item.fontSize === "sm" ? 12 : item.fontSize === "base" ? 14 : item.fontSize === "lg" ? 16 : item.fontSize === "xl" ? 18 : item.fontSize === "2xl" ? 22 : item.fontSize === "3xl" ? 28 : 36,
                    fontWeight: item.fontWeight || "bold",
                    textAlign: item.textAlign || "center",
                    color: item.textColor || "#ffffff",
                    isGradientText: false,
                    textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" }
                });
                loadGoogleFont("Outfit");
            }
        }
        
        setElements(initialElements);
        setSelectedId(null);
        setShowEditor(true);
    };

    const handleCreateNew = () => {
        setEditItem(null);
        setTitle("New Popup Campaign");
        setLinkUrl("");
        setSize("md");
        setBorderRadius("2xl");
        setCanvasBg({
            type: "mesh",
            color1: "#0a0a0c",
            color2: "#181824",
            color3: "#2c1b3d",
            color4: "#122a27",
            direction: "to-r",
            conicAngle: "0deg"
        });
        setElements([
            {
                id: "initial-heading",
                type: "text",
                content: "EXCLUSIVE DROP",
                x: 40,
                y: 60,
                width: 300,
                height: 40,
                zIndex: 1,
                isLocked: false,
                fontFamily: "Outfit",
                fontSize: 28,
                fontWeight: "black",
                textAlign: "center",
                color: "#f43f5e",
                isGradientText: false,
                textGradient: { start: "#f43f5e", end: "#3b82f6", dir: "to-r" }
            },
            {
                id: "initial-body",
                type: "text",
                content: "GET 10% OFF ON NEW ARRIVALS",
                x: 40,
                y: 350,
                width: 300,
                height: 60,
                zIndex: 2,
                isLocked: false,
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "bold",
                textAlign: "center",
                color: "#ffffff",
                isGradientText: false,
                textGradient: { start: "#ffffff", end: "#888888", dir: "to-r" }
            }
        ]);
        loadGoogleFont("Outfit");
        loadGoogleFont("Inter");
        setSelectedId(null);
        setShowEditor(true);
    };

    // Element management
    const addTextElement = () => {
        const id = `text-${Date.now()}`;
        const newEl = {
            id,
            type: "text",
            content: "Double Click to Edit",
            x: 90,
            y: 200,
            width: 200,
            height: 40,
            zIndex: elements.length + 1,
            isLocked: false,
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center",
            color: "#ffffff",
            isGradientText: false,
            textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" }
        };
        setElements([...elements, newEl]);
        setSelectedId(id);
    };

    const handleAddImageFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const id = `image-${Date.now()}`;
                const newEl = {
                    id,
                    type: "image",
                    url: reader.result,
                    x: 60,
                    y: 120,
                    width: 260,
                    height: 180,
                    zIndex: elements.length + 1,
                    isLocked: false,
                    filter: { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 }
                };
                setElements([...elements, newEl]);
                setSelectedId(id);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddImageLink = () => {
        if (!imageLinkInput) return;
        const id = `image-${Date.now()}`;
        const newEl = {
            id,
            type: "image",
            url: imageLinkInput,
            x: 60,
            y: 120,
            width: 260,
            height: 180,
            zIndex: elements.length + 1,
            isLocked: false,
            filter: { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 }
        };
        setElements([...elements, newEl]);
        setSelectedId(id);
        setImageLinkInput("");
    };

    const addBasicShape = (shapeType) => {
        const id = `shape-${Date.now()}`;
        const newEl = {
            id,
            type: "shape",
            shapeType, // 'rect' | 'circle'
            x: 120,
            y: 150,
            width: 120,
            height: 120,
            zIndex: elements.length + 1,
            isLocked: false,
            fill: "#ff007f",
            stroke: "transparent",
            strokeWidth: 0,
            blur: 0
        };
        setElements([...elements, newEl]);
        setSelectedId(id);
    };

    // Pen drawing tool interaction
    const handleCanvasClick = (e) => {
        if (!isPenMode) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPenPoints([...penPoints, { x, y }]);
    };

    const handleCompletePenPath = () => {
        if (penPoints.length < 2) {
            setIsPenMode(false);
            setPenPoints([]);
            return;
        }

        // Calculate bounding box bounds
        const xs = penPoints.map(p => p.x);
        const ys = penPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        const width = Math.max(20, maxX - minX);
        const height = Math.max(20, maxY - minY);

        // Normalize points relative to bounding box coords
        const normalizedPoints = penPoints.map(p => ({
            x: p.x - minX,
            y: p.y - minY
        }));

        const id = `shape-custom-${Date.now()}`;
        const newEl = {
            id,
            type: "shape",
            shapeType: "custom",
            path: normalizedPoints,
            x: minX,
            y: minY,
            width,
            height,
            zIndex: elements.length + 1,
            isLocked: false,
            fill: "#db2777",
            stroke: "#ffffff",
            strokeWidth: 2,
            blur: 0
        };

        setElements([...elements, newEl]);
        setSelectedId(id);
        setIsPenMode(false);
        setPenPoints([]);
    };

    // Drag-resize Mouse down handler
    const handleElementMouseDown = (e, item, isResize = false) => {
        if (isPenMode) return;
        e.stopPropagation();
        setSelectedId(item.id);
        
        if (item.isLocked) return;

        dragInfo.current = {
            isDragging: !isResize,
            isResizing: isResize,
            startX: e.clientX,
            startY: e.clientY,
            elementX: item.x,
            elementY: item.y,
            elementW: item.width,
            elementH: item.height
        };

        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isDragging && !info.isResizing) return;

        const dx = e.clientX - info.startX;
        const dy = e.clientY - info.startY;

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;

            if (info.isDragging) {
                return {
                    ...el,
                    x: Math.max(-50, Math.min(380, info.elementX + dx)),
                    y: Math.max(-50, Math.min(500, info.elementY + dy))
                };
            } else if (info.isResizing) {
                return {
                    ...el,
                    width: Math.max(20, info.elementW + dx),
                    height: Math.max(20, info.elementH + dy)
                };
            }
            return el;
        }));
    };

    const handleGlobalMouseUp = () => {
        dragInfo.current.isDragging = false;
        dragInfo.current.isResizing = false;
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
    };

    // Layer ordering handlers
    const moveZIndex = (direction) => {
        if (!selectedId) return;
        const index = elements.findIndex(el => el.id === selectedId);
        if (index === -1) return;

        let list = [...elements].sort((a, b) => a.zIndex - b.zIndex);
        const itemIdx = list.findIndex(el => el.id === selectedId);

        if (direction === "front") {
            const maxZ = Math.max(...list.map(el => el.zIndex), 0);
            setElements(prev => prev.map(el => el.id === selectedId ? { ...el, zIndex: maxZ + 1 } : el));
        } else if (direction === "back") {
            const minZ = Math.min(...list.map(el => el.zIndex), 0);
            setElements(prev => prev.map(el => el.id === selectedId ? { ...el, zIndex: minZ - 1 } : el));
        } else if (direction === "forward" && itemIdx < list.length - 1) {
            // Swap zIndex with next element
            const nextItem = list[itemIdx + 1];
            setElements(prev => prev.map(el => {
                if (el.id === selectedId) return { ...el, zIndex: nextItem.zIndex };
                if (el.id === nextItem.id) return { ...el, zIndex: list[itemIdx].zIndex };
                return el;
            }));
        } else if (direction === "backward" && itemIdx > 0) {
            // Swap zIndex with previous element
            const prevItem = list[itemIdx - 1];
            setElements(prev => prev.map(el => {
                if (el.id === selectedId) return { ...el, zIndex: prevItem.zIndex };
                if (el.id === prevItem.id) return { ...el, zIndex: list[itemIdx].zIndex };
                return el;
            }));
        }
    };

    const handleDeleteElement = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
    };

    const updateSelectedElement = (key, value) => {
        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return { ...el, [key]: value };
        }));
    };

    // html2canvas Compile & Save Pipeline
    const handleCompileAndSave = async (isPublishing = false) => {
        if (!canvasRef.current) return;
        setSelectedId(null); // Deselect so overlay border lines are not baked in
        
        // Let state update to remove selector borders
        await new Promise(r => setTimeout(r, 100));

        try {
            // Render vector canvas element to raster PNG
            const canvas = await html2canvas(canvasRef.current, {
                useCORS: true,
                backgroundColor: null,
                width: 380,
                height: 500,
                scale: 2 // Render double size for crisp sharp text
            });

            // Convert canvas to Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
            const imageFile = new File([blob], `${title.replace(/ /g, "_")}-${Date.now()}.png`, { type: "image/png" });

            const data = new FormData();
            data.append("title", title);
            data.append("text", "Canvas Compiled Poster"); // Legacy text field mapping
            data.append("isActive", isPublishing ? "true" : editItem ? String(editItem.isActive) : "false");
            data.append("isDraft", isPublishing ? "false" : "true");
            data.append("image", imageFile);

            if (editItem) {
                await handleUpdatePopup(editItem._id, data);
            } else {
                await handleCreatePopup(data);
            }
            
            resetForm();
        } catch (err) {
            console.error("Canvas export failed", err);
        }
    };

    const resetForm = () => {
        setElements([]);
        setSelectedId(null);
        setTitle("");
        setLinkUrl("");
        setEditItem(null);
        setShowEditor(false);
        setIsPenMode(false);
        setPenPoints([]);
    };

    const handleDeleteCampaign = () => {
        if (deleteModal.id) {
            handleDeletePopup(deleteModal.id);
        }
        setDeleteModal({ isOpen: false, id: null });
    };

    const selectedItem = elements.find(el => el.id === selectedId);

    if (loading && allPopups.length === 0) return <PageLoader skeleton={AdminTaxonomySkeleton} />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteCampaign}
                title="Delete Poster Campaign?"
                description="This will permanently delete this poster asset from the store."
                confirmText="Delete Now"
                type="danger"
            />

            {!showEditor ? (
                <>
                    {/* List View */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-accent uppercase">Marketing Desk</span>
                            <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Popup Canvas</h1>
                            <p className="text-foreground/40 mt-2">Design visual posters using pen drawings, mesh gradients, Google Fonts, and filters, and broadcast them instantly.</p>
                        </div>
                        <PrimaryBtn icon="ri-paint-brush-line" onClick={handleCreateNew}>Create Poster</PrimaryBtn>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allPopups.map((popup) => (
                            <div 
                                key={popup._id} 
                                className={`border rounded-3xl p-6 transition-all duration-300 relative flex flex-col justify-between min-h-[220px] bg-gradient-to-br
                                    ${popup.isActive 
                                        ? "border-accent/40 bg-accent/[0.01] shadow-accent/5 shadow-md" 
                                        : "border-border-theme/60 bg-surface/30 hover:bg-surface/50"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-black text-foreground uppercase truncate max-w-[170px]">{popup.title}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {popup.isActive && (
                                            <span className="text-[8px] font-black tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                                            </span>
                                        )}
                                        {popup.isDraft && (
                                            <span className="text-[8px] font-black tracking-widest uppercase bg-foreground/5 border border-border-theme text-foreground/45 px-2 py-0.5 rounded-full">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-3 items-center min-w-0 mb-6">
                                    {popup.imageUrl ? (
                                        <div className="w-20 h-24 rounded-2xl border border-border-theme/40 bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            <img src={popup.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-24 rounded-2xl border border-border-theme/40 bg-background flex-shrink-0 flex items-center justify-center text-foreground/25">
                                            <i className="ri-window-line text-2xl" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-foreground/35 font-bold uppercase tracking-wide">Publish Stats:</p>
                                        <p className="text-xs font-black text-foreground mt-0.5">Auto-closes in 5 seconds</p>
                                        <p className="text-[8px] font-bold text-foreground/45 mt-1 truncate">Action: {popup.linkUrl || "No Redirect Link"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-border-theme/30 pt-4">
                                    <button
                                        onClick={() => handleTogglePopupActive(popup._id)}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border
                                            ${popup.isActive 
                                                ? "bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500 hover:text-white" 
                                                : "bg-accent/10 text-accent border-accent/25 hover:bg-accent hover:text-accent-content"
                                            }`}
                                    >
                                        {popup.isActive ? "Deactivate" : "Publish Live"}
                                    </button>

                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => handleEditCampaign(popup)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/40 hover:bg-accent hover:text-accent-content transition-all cursor-pointer"
                                            title="Edit Design Canvas"
                                        >
                                            <i className="ri-edit-line text-sm" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, id: popup._id })}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/45 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                            title="Delete"
                                        >
                                            <i className="ri-delete-bin-line text-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* Full Canva-Style workspace editor */
                <div className="flex flex-col h-[85vh] bg-surface/30 border border-border-theme rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    {/* Editor Top Bar */}
                    <div className="p-4 bg-surface/75 border-b border-border-theme/40 flex items-center justify-between flex-wrap gap-4 z-50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetForm}
                                className="w-8 h-8 rounded-xl border border-border-theme flex items-center justify-center hover:bg-white/5 cursor-pointer text-foreground/60"
                            >
                                <i className="ri-arrow-left-line text-sm" />
                            </button>
                            <input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                className="bg-transparent border-b border-transparent hover:border-border-theme/40 focus:border-accent text-sm font-black uppercase outline-none px-1 py-0.5" 
                                placeholder="Poster Title..."
                            />
                        </div>

                        {/* Pen Drawing Indicator Overlay */}
                        {isPenMode && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full animate-pulse">
                                Pen Active: Click canvas to draw. Double-click or click Done to close.
                            </span>
                        )}

                        {/* Top controls toolbox */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addTextElement}
                                className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-wider cursor-pointer border border-border-theme/40"
                            >
                                <i className="ri-text mr-1" /> Add Text
                            </button>
                            
                            <div className="relative">
                                <button
                                    onClick={() => document.getElementById("canvas-image-upload").click()}
                                    className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-wider cursor-pointer border border-border-theme/40"
                                >
                                    <i className="ri-image-add-line mr-1" /> Add Image
                                </button>
                                <input 
                                    id="canvas-image-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleAddImageFile} 
                                    className="hidden" 
                                />
                            </div>

                            <button
                                onClick={() => addBasicShape("rect")}
                                className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-wider cursor-pointer border border-border-theme/40"
                            >
                                <i className="ri-checkbox-blank-line mr-1" /> Rect
                            </button>
                            <button
                                onClick={() => addBasicShape("circle")}
                                className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-wider cursor-pointer border border-border-theme/40"
                            >
                                <i className="ri-checkbox-blank-circle-line mr-1" /> Circle
                            </button>
                            <button
                                onClick={() => {
                                    setIsPenMode(!isPenMode);
                                    setPenPoints([]);
                                    setSelectedId(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border 
                                    ${isPenMode ? "bg-accent text-accent-content border-accent/40" : "bg-foreground/5 hover:bg-foreground/10 border-border-theme/40"}`}
                            >
                                <i className="ri-pen-nib-line mr-1" /> Pen Tool
                            </button>
                            {isPenMode && penPoints.length >= 2 && (
                                <button
                                    onClick={handleCompletePenPath}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                    Complete Pen Shape
                                </button>
                            )}
                        </div>

                        {/* Save Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCompileAndSave(false)}
                                className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest border border-border-theme/40 rounded-xl cursor-pointer"
                            >
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleCompileAndSave(true)}
                                className="px-4 py-2 bg-accent text-accent-content hover:bg-accent/90 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-md"
                            >
                                Publish Live ⚡
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Frame */}
                    <div className="flex-grow flex overflow-hidden">
                        
                        {/* Properties sidebar (Left) */}
                        <div className="w-80 bg-surface/50 border-r border-border-theme/40 overflow-y-auto p-5 space-y-5">
                            {selectedItem ? (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Layer Attributes</h3>
                                        <button
                                            onClick={handleDeleteElement}
                                            className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                                            title="Delete Selected Element"
                                        >
                                            <i className="ri-delete-bin-line text-xs" />
                                        </button>
                                    </div>

                                    {/* Position locking toggle */}
                                    <div className="flex items-center justify-between p-3 bg-background/30 border border-border-theme/40 rounded-2xl">
                                        <span className="text-[10px] font-bold text-foreground/60 uppercase">Lock Position</span>
                                        <button
                                            onClick={() => updateSelectedElement("isLocked", !selectedItem.isLocked)}
                                            className={`w-14 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border
                                                ${selectedItem.isLocked 
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/25" 
                                                    : "bg-foreground/5 text-foreground/50 border-border-theme/40"
                                                }`}
                                        >
                                            {selectedItem.isLocked ? "Locked 🔒" : "Unlock 🔓"}
                                        </button>
                                    </div>

                                    {/* Layer ordering options */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-foreground/45">Arrange Layer</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => moveZIndex("forward")} className="py-2 bg-background/50 hover:bg-white/5 border border-border-theme/60 text-[9px] font-bold uppercase rounded-xl">Bring Forward</button>
                                            <button onClick={() => moveZIndex("backward")} className="py-2 bg-background/50 hover:bg-white/5 border border-border-theme/60 text-[9px] font-bold uppercase rounded-xl">Send Backward</button>
                                            <button onClick={() => moveZIndex("front")} className="py-2 bg-background/50 hover:bg-white/5 border border-border-theme/60 text-[9px] font-bold uppercase rounded-xl col-span-2">Bring To Front</button>
                                            <button onClick={() => moveZIndex("back")} className="py-2 bg-background/50 hover:bg-white/5 border border-border-theme/60 text-[9px] font-bold uppercase rounded-xl col-span-2">Send To Back</button>
                                        </div>
                                    </div>

                                    {/* Custom options depending on layer type */}
                                    {selectedItem.type === "text" && (
                                        <div className="space-y-4 pt-2 border-t border-border-theme/30">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Text content</label>
                                                <textarea 
                                                    rows="3" 
                                                    value={selectedItem.content} 
                                                    onChange={e => updateSelectedElement("content", e.target.value)} 
                                                    className={inputCls} 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Font Family</label>
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
                                                    <label className="text-[9px] font-black uppercase text-foreground/45">Font Size</label>
                                                    <input type="number" value={selectedItem.fontSize} onChange={e => updateSelectedElement("fontSize", parseInt(e.target.value) || 12)} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-foreground/45">Font Weight</label>
                                                    <select value={selectedItem.fontWeight} onChange={e => updateSelectedElement("fontWeight", e.target.value)} className={inputCls}>
                                                        <option value="normal">Normal</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="bold">Bold</option>
                                                        <option value="black">Black</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Text Gradient Toggle */}
                                            <div className="flex items-center gap-2 py-1">
                                                <input 
                                                    type="checkbox" 
                                                    id="isGradientText" 
                                                    checked={selectedItem.isGradientText} 
                                                    onChange={e => updateSelectedElement("isGradientText", e.target.checked)} 
                                                    className="w-4 h-4 accent-accent cursor-pointer"
                                                />
                                                <label htmlFor="isGradientText" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">Use Gradient Text</label>
                                            </div>

                                            {!selectedItem.isGradientText ? (
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-foreground/45">Text Color</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" value={selectedItem.color} onChange={e => updateSelectedElement("color", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer" />
                                                        <input type="text" value={selectedItem.color} onChange={e => updateSelectedElement("color", e.target.value)} className={inputCls} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 border-l-2 border-accent/40 pl-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[8px] font-bold text-foreground/45 block">Start Color</label>
                                                            <input type="color" value={selectedItem.textGradient.start} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, start: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-foreground/45 block">End Color</label>
                                                            <input type="color" value={selectedItem.textGradient.end} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, end: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-bold text-foreground/45 block">Gradient Direction</label>
                                                        <select value={selectedItem.textGradient.dir} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, dir: e.target.value })} className={inputCls}>
                                                            <option value="to-r">Left to Right</option>
                                                            <option value="to-b">Top to Bottom</option>
                                                            <option value="to-tr">Diagonal</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Text Align</label>
                                                <select value={selectedItem.textAlign} onChange={e => updateSelectedElement("textAlign", e.target.value)} className={inputCls}>
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {selectedItem.type === "image" && (
                                        <div className="space-y-4 pt-2 border-t border-border-theme/30">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Image Link URL</label>
                                                <input value={selectedItem.url} onChange={e => updateSelectedElement("url", e.target.value)} className={inputCls} placeholder="https://..." />
                                            </div>

                                            {/* Filters */}
                                            <div className="border border-border-theme/40 bg-background/20 rounded-2xl p-4 space-y-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-accent">Image Filters</span>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                        <span>Blur: {selectedItem.filter.blur}px</span>
                                                    </div>
                                                    <input type="range" min="0" max="15" value={selectedItem.filter.blur} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, blur: parseInt(e.target.value) })} className={sliderCls} />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                        <span>Brightness: {selectedItem.filter.brightness}%</span>
                                                    </div>
                                                    <input type="range" min="20" max="180" value={selectedItem.filter.brightness} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, brightness: parseInt(e.target.value) })} className={sliderCls} />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                        <span>Contrast: {selectedItem.filter.contrast}%</span>
                                                    </div>
                                                    <input type="range" min="20" max="180" value={selectedItem.filter.contrast} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, contrast: parseInt(e.target.value) })} className={sliderCls} />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                        <span>Grayscale: {selectedItem.filter.grayscale}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="100" value={selectedItem.filter.grayscale} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, grayscale: parseInt(e.target.value) })} className={sliderCls} />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                        <span>Sepia: {selectedItem.filter.sepia}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="100" value={selectedItem.filter.sepia} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, sepia: parseInt(e.target.value) })} className={sliderCls} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedItem.type === "shape" && (
                                        <div className="space-y-4 pt-2 border-t border-border-theme/30">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Shape Fill Color</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={selectedItem.fill} onChange={e => updateSelectedElement("fill", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer" />
                                                    <input type="text" value={selectedItem.fill} onChange={e => updateSelectedElement("fill", e.target.value)} className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Shape Stroke Color</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={selectedItem.stroke} onChange={e => updateSelectedElement("stroke", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer" />
                                                    <input type="text" value={selectedItem.stroke} onChange={e => updateSelectedElement("stroke", e.target.value)} className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-foreground/45">Stroke Border Width</label>
                                                <input type="number" value={selectedItem.strokeWidth} onChange={e => updateSelectedElement("strokeWidth", parseInt(e.target.value) || 0)} className={inputCls} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[9px] font-bold text-foreground/60">
                                                    <span>Layer Blur: {selectedItem.blur}px</span>
                                                </div>
                                                <input type="range" min="0" max="25" value={selectedItem.blur} onChange={e => updateSelectedElement("blur", parseInt(e.target.value))} className={sliderCls} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-foreground/30 font-medium uppercase text-[10px] tracking-widest border border-dashed border-border-theme/30 rounded-2xl">
                                    Select an element on canvas to edit properties
                                </div>
                            )}
                        </div>

                        {/* Interactive Design Canvas Container (Center) */}
                        <div className="flex-1 bg-background flex items-center justify-center p-6 relative overflow-auto">
                            {/* Bounding Canvas limits (380x500 standard poster bounds) */}
                            <div
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className={`relative w-[380px] h-[500px] shadow-2xl transition-all border border-white/5 select-none shrink-0 overflow-hidden
                                    ${isPenMode ? "cursor-pencil" : "cursor-default"}`}
                                style={{
                                    background: getCanvasBackgroundCSS(),
                                    borderRadius: borderRadius === "none" ? "0px" : borderRadius === "md" ? "12px" : borderRadius === "lg" ? "16px" : borderRadius === "full" ? "40px" : "24px"
                                }}
                            >
                                {/* Vector Render Elements */}
                                {elements.map((el) => {
                                    const isSelected = el.id === selectedId;
                                    
                                    return (
                                        <div
                                            key={el.id}
                                            onMouseDown={(e) => handleElementMouseDown(e, el)}
                                            style={{
                                                position: "absolute",
                                                left: `${el.x}px`,
                                                top: `${el.y}px`,
                                                width: `${el.width}px`,
                                                height: `${el.height}px`,
                                                zIndex: el.zIndex,
                                                outline: isSelected ? "2.5px solid var(--color-accent)" : "none",
                                            }}
                                            className={`${isSelected ? "z-[1000]" : ""}`}
                                        >
                                            {/* Selection resize anchor */}
                                            {isSelected && !el.isLocked && (
                                                <div 
                                                    onMouseDown={(e) => handleElementMouseDown(e, el, true)}
                                                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-accent border-2 border-white rounded-full cursor-se-resize z-50 shadow-md flex items-center justify-center"
                                                />
                                            )}

                                            {/* Content: Text */}
                                            {el.type === "text" && (
                                                <p
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
                                                    }}
                                                >
                                                    {el.content}
                                                </p>
                                            )}

                                            {/* Content: Image */}
                                            {el.type === "image" && (
                                                <img
                                                    src={el.url}
                                                    alt="Canvas Layer"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectCover: "cover",
                                                        pointerEvents: "none",
                                                        ...getImageFilterStyle(el.filter)
                                                    }}
                                                />
                                            )}

                                            {/* Content: Shape */}
                                            {el.type === "shape" && (
                                                <div className="w-full h-full" style={{ filter: el.blur > 0 ? `blur(${el.blur}px)` : "none" }}>
                                                    {el.shapeType === "rect" && (
                                                        <div 
                                                            className="w-full h-full" 
                                                            style={{ 
                                                                backgroundColor: el.fill,
                                                                border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : "none" 
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
                                                    {el.shapeType === "custom" && el.path && (
                                                        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
                                                            <polygon
                                                                points={el.path.map(pt => `${(pt.x / el.width) * el.width},${(pt.y / el.height) * el.height}`).join(" ")}
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
                                })}

                                {/* SVG Overlay when drawing with Pen Tool */}
                                {isPenMode && (
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[999]">
                                        {penPoints.map((pt, idx) => (
                                            <circle key={idx} cx={pt.x} cy={pt.y} r={4} fill="#db2777" stroke="#ffffff" strokeWidth={1} />
                                        ))}
                                        {penPoints.length > 1 && (
                                            <polyline
                                                points={penPoints.map(pt => `${pt.x},${pt.y}`).join(" ")}
                                                fill="none"
                                                stroke="#db2777"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                            />
                                        )}
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Page & Canvas Properties Sidebar (Right) */}
                        <div className="w-80 bg-surface/50 border-l border-border-theme/40 overflow-y-auto p-5 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Poster Configuration</h3>

                            {/* Canvas Background mode picker */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Canvas Background Type</label>
                                    <select 
                                        value={canvasBg.type} 
                                        onChange={e => setCanvasBg({ ...canvasBg, type: e.target.value })} 
                                        className={inputCls}
                                    >
                                        <option value="solid">Solid Background</option>
                                        <option value="linear">Linear Gradient</option>
                                        <option value="radial">Radial Gradient</option>
                                        <option value="conic">Conical Gradient</option>
                                        <option value="mesh">Mesh Gradient (4-Point)</option>
                                    </select>
                                </div>

                                {/* Background color selectors */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[8px] font-bold text-foreground/45 block mb-1">Color 1 (TL)</label>
                                            <input type="color" value={canvasBg.color1} onChange={e => setCanvasBg({ ...canvasBg, color1: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                        </div>
                                        {canvasBg.type !== "solid" && (
                                            <div>
                                                <label className="text-[8px] font-bold text-foreground/45 block mb-1">Color 2 (TR)</label>
                                                <input type="color" value={canvasBg.color2} onChange={e => setCanvasBg({ ...canvasBg, color2: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                            </div>
                                        )}
                                    </div>

                                    {canvasBg.type === "mesh" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[8px] font-bold text-foreground/45 block mb-1">Color 3 (BR)</label>
                                                <input type="color" value={canvasBg.color3} onChange={e => setCanvasBg({ ...canvasBg, color3: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-foreground/45 block mb-1">Color 4 (BL)</label>
                                                <input type="color" value={canvasBg.color4} onChange={e => setCanvasBg({ ...canvasBg, color4: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                            </div>
                                        </div>
                                    )}

                                    {canvasBg.type === "linear" && (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Gradient Flow</label>
                                            <select value={canvasBg.direction} onChange={e => setCanvasBg({ ...canvasBg, direction: e.target.value })} className={inputCls}>
                                                <option value="to-r">Left to Right</option>
                                                <option value="to-b">Top to Bottom</option>
                                                <option value="to-tr">Top Right Diagonal</option>
                                            </select>
                                        </div>
                                    )}

                                    {canvasBg.type === "conic" && (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Conic Angle</label>
                                            <input type="text" value={canvasBg.conicAngle} onChange={e => setCanvasBg({ ...canvasBg, conicAngle: e.target.value })} className={inputCls} placeholder="e.g. 45deg" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Border Radius Customizer */}
                            <div>
                                <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Poster Border Corners</label>
                                <select value={borderRadius} onChange={e => setBorderRadius(e.target.value)} className={inputCls}>
                                    <option value="none">Sharp / No Corners</option>
                                    <option value="md">Slightly Rounded</option>
                                    <option value="lg">Rounded</option>
                                    <option value="2xl">Very Rounded</option>
                                    <option value="full">Pill Modals</option>
                                </select>
                            </div>

                            {/* Image links properties */}
                            <div className="border-t border-border-theme/40 pt-4 space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Image Link insertion</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={imageLinkInput} 
                                            onChange={e => setImageLinkInput(e.target.value)} 
                                            className={inputCls} 
                                            placeholder="Paste Image URL..." 
                                        />
                                        <button 
                                            onClick={handleAddImageLink}
                                            className="px-3 bg-accent text-accent-content hover:bg-accent/95 rounded-xl text-xs font-black uppercase cursor-pointer"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/45 ml-1">Poster Action Redirect Link</label>
                                    <input 
                                        value={linkUrl} 
                                        onChange={e => setLinkUrl(e.target.value)} 
                                        className={inputCls} 
                                        placeholder="e.g. /shop or /products/ID" 
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPopupsPage;
