import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { usePopup } from "../Hooks/usePopup";
import { PrimaryBtn, SecondaryBtn } from "../../Components/Buttons";
import Modal from "../../Components/Modal";
import PageLoader from "../../Components/PageLoader";
import { AdminTaxonomySkeleton } from "../../Components/Skeletons";
import html2canvas from "html2canvas-pro";

import CanvasElement from "../Components/CanvasElement";
import LeftSidebar from "../Components/LeftSidebar";
import RightSidebar from "../Components/RightSidebar";
import ContextMenu from "../Components/ContextMenu";
import PopupPreview from "../Components/PopupPreview";
import { PRESET_SHAPES, PRESET_GRADIENTS, TEXT_PRESETS, CANVAS_SIZES } from "../Components/CanvasPresets";

const AdminPopupsPage = () => {
    const inputCls = "w-full bg-[#1b1b1f] border border-white/10 focus:border-accent rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-medium";
    const sliderCls = "w-full accent-accent bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer";

    const { allPopups, loading } = useSelector((state) => state.popup);
    const {
        fetchAllPopups,
        handleCreatePopup,
        handleUpdatePopup,
        handleDeletePopup,
        handleTogglePopupActive,
    } = usePopup();

    // Infinite canvas workspace references & state
    const canvasRef = useRef(null);
    const desktopCanvasRef = useRef(null);
    const tabletCanvasRef = useRef(null);
    const mobileCanvasRef = useRef(null);
    const tvCanvasRef = useRef(null);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Multi-device responsive states
    const [activeDevice, setActiveDevice] = useState("desktop");
    const [deviceDesigns, setDeviceDesigns] = useState({
        desktop: { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 800, canvasHeight: 500 },
        tablet:  { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 540, canvasHeight: 700 },
        mobile:  { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 360, canvasHeight: 640 },
        tv:      { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 1280, canvasHeight: 720 }
    });

    const [canvasBg, setCanvasBg] = useState({
        type: "solid",
        color1: "#111111",
        color2: "#333333",
        color3: "#4f46e5",
        color4: "#db2777",
        direction: "to-r",
        conicAngle: "0deg",
        grainOpacity: 0,
        p1: { x: 10, y: 15 },
        p2: { x: 90, y: 10 },
        p3: { x: 85, y: 85 },
        p4: { x: 15, y: 90 },
        stops: [
            { color: "#111111", offset: 0 },
            { color: "#333333", offset: 100 }
        ]
    });

    // Dynamic sizing states
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(500);

    // Dynamic campaign display time in seconds
    const [displayTime, setDisplayTime] = useState(5);
    // Active mesh gradient control node ID
    const [selectedMeshPointId, setSelectedMeshPointId] = useState(null);
    // Fullscreen editor focus mode
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Editor states
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [title, setTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [borderRadius, setBorderRadius] = useState("2xl");
    const [editItem, setEditItem] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [isPenMode, setIsPenMode] = useState(false);
    const [penPoints, setPenPoints] = useState([]);

    // Advanced features & UI states
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const [activeSidebarTab, setActiveSidebarTab] = useState("assets");
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
    const [editingTextId, setEditingTextId] = useState(null);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [clipContent, setClipContent] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [imageLinkInput, setImageLinkInput] = useState("");
    const [loadedFonts, setLoadedFonts] = useState(new Set(["Inter"]));

    // Drag, resize, rotate refs
    const dragInfo = useRef({
        isDragging: false,
        isResizing: false,
        isRotating: false,
        isDraggingMeshPoint: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
        elementW: 0,
        elementH: 0,
        elementR: 0,
        centerX: 0,
        centerY: 0,
        handle: "",
        pointIndex: 0
    });

    const elementsRef = useRef(elements);
    const canvasBgRef = useRef(canvasBg);
    const dragStartElements = useRef(null);
    const dragStartBg = useRef(null);

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    useEffect(() => {
        canvasBgRef.current = canvasBg;
    }, [canvasBg]);

    useEffect(() => {
        fetchAllPopups();
    }, []);

    // Listen for Space bar keydowns to toggle pan mode
    useEffect(() => {
        const handleSpaceDown = (e) => {
            if (e.code === "Space" && showEditor) {
                const active = document.activeElement;
                const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.contentEditable === "true");
                if (!isTyping) {
                    e.preventDefault();
                    setIsSpaceHeld(true);
                }
            }
        };
        const handleSpaceUp = (e) => {
            if (e.code === "Space") {
                setIsSpaceHeld(false);
            }
        };
        window.addEventListener("keydown", handleSpaceDown);
        window.addEventListener("keyup", handleSpaceUp);
        return () => {
            window.removeEventListener("keydown", handleSpaceDown);
            window.removeEventListener("keyup", handleSpaceUp);
        };
    }, [showEditor]);

    // Lock body scroll in fullscreen mode
    useEffect(() => {
        if (isFullScreen && showEditor) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [isFullScreen, showEditor]);

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

    // Device switcher that synchronizes state
    const switchDevice = (newDevice) => {
        setDeviceDesigns(prev => {
            const updated = {
                ...prev,
                [activeDevice]: {
                    elements,
                    canvasBg,
                    canvasWidth,
                    canvasHeight
                }
            };
            saveToLocalStorage(elements, canvasBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime, newDevice, updated);
            
            let target = updated[newDevice] || {
                elements: [],
                canvasBg: { ...canvasBg },
                canvasWidth: newDevice === "desktop" ? 800 : newDevice === "tablet" ? 540 : newDevice === "mobile" ? 360 : 1280,
                canvasHeight: newDevice === "desktop" ? 500 : newDevice === "tablet" ? 700 : newDevice === "mobile" ? 640 : 720
            };
            
            if ((!target.elements || target.elements.length === 0) && elements.length > 0) {
                const targetW = newDevice === "desktop" ? 800 : newDevice === "tablet" ? 540 : newDevice === "mobile" ? 360 : 1280;
                const targetH = newDevice === "desktop" ? 500 : newDevice === "tablet" ? 700 : newDevice === "mobile" ? 640 : 720;
                const activeW = canvasWidth || 800;
                const activeH = canvasHeight || 500;
                
                target.elements = elements.map(el => ({
                    ...el,
                    x: Math.round(el.x * targetW / activeW),
                    y: Math.round(el.y * targetH / activeH),
                    width: Math.round(el.width * targetW / activeW),
                    height: Math.round(el.height * targetH / activeH)
                }));
                target.canvasBg = { ...canvasBg };
                updated[newDevice] = target;
            }
            
            setElements(target.elements || []);
            setCanvasBg(target.canvasBg || { type: "solid", color1: "#111111" });
            setCanvasWidth(target.canvasWidth || 800);
            setCanvasHeight(target.canvasHeight || 500);
            return updated;
        });
        setActiveDevice(newDevice);
        setSelectedId(null);
        setSelectedMeshPointId(null);
    };

    // Undo / Redo engine
    const pushToHistoryState = (newElements, newBg = canvasBg) => {
        setPast(prev => [...prev.slice(-49), { elements: elementsRef.current, canvasBg: canvasBgRef.current }]);
        setFuture([]);
        setElements(newElements);
        if (newBg !== canvasBg) {
            setCanvasBg(newBg);
        }
        saveToLocalStorage(newElements, newBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    };

    const handleUndo = () => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        setFuture(prev => [{ elements: elementsRef.current, canvasBg: canvasBgRef.current }, ...prev]);
        setPast(prev => prev.slice(0, -1));
        setElements(previous.elements);
        setCanvasBg(previous.canvasBg);
        saveToLocalStorage(previous.elements, previous.canvasBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const next = future[0];
        setPast(prev => [...prev, { elements: elementsRef.current, canvasBg: canvasBgRef.current }]);
        setFuture(prev => prev.slice(1));
        setElements(next.elements);
        setCanvasBg(next.canvasBg);
        saveToLocalStorage(next.elements, next.canvasBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    };

    // Auto-Save draft recovery v2 (keeps all 4 devices)
    const saveToLocalStorage = (els = elements, bg = canvasBg, br = borderRadius, t = title, link = linkUrl, w = canvasWidth, h = canvasHeight, time = displayTime, device = activeDevice, designs = deviceDesigns) => {
        try {
            const updatedDesigns = {
                ...designs,
                [device]: {
                    elements: els,
                    canvasBg: bg,
                    canvasWidth: w,
                    canvasHeight: h
                }
            };
            const data = {
                deviceDesigns: updatedDesigns,
                activeDevice: device,
                borderRadius: br,
                title: t,
                linkUrl: link,
                displayTime: time,
                timestamp: Date.now()
            };
            localStorage.setItem("snitch_popup_canvas_draft_v2", JSON.stringify(data));
        } catch (e) {
            console.error("Local storage save failed", e);
        }
    };

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem("snitch_popup_canvas_draft_v2");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.deviceDesigns) {
                    setDeviceDesigns(parsed.deviceDesigns);
                    const dev = parsed.activeDevice || "desktop";
                    setActiveDevice(dev);
                    const target = parsed.deviceDesigns[dev];
                    if (target) {
                        setElements(target.elements || []);
                        setCanvasBg(target.canvasBg || { type: "solid", color1: "#111111" });
                        setCanvasWidth(target.canvasWidth || 800);
                        setCanvasHeight(target.canvasHeight || 500);
                    }
                }
                if (parsed.borderRadius) setBorderRadius(parsed.borderRadius);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.linkUrl) setLinkUrl(parsed.linkUrl);
                if (parsed.displayTime) setDisplayTime(parsed.displayTime);
            }
        } catch (e) {
            console.error("Failed to restore draft", e);
        }
    };

    const hasLocalStorageBackup = () => {
        return !!localStorage.getItem("snitch_popup_canvas_draft_v2");
    };

    // Keyboard bindings matching Canva/Figma hotkeys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                e.preventDefault();
                handleRedo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
                e.preventDefault();
                handleDuplicateElement(selectedId);
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
                e.preventDefault();
                setCanvasZoom(z => Math.min(4, z + 0.1));
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
                e.preventDefault();
                setCanvasZoom(z => Math.max(0.1, z - 0.1));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "0") {
                e.preventDefault();
                setCanvasZoom(1);
                setCanvasOffset({ x: 0, y: 0 });
            }
            if ((e.key === "Delete" || e.key === "Backspace") && selectedId && editingTextId === null) {
                const active = document.activeElement;
                const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.contentEditable === "true");
                if (!isTyping) {
                    e.preventDefault();
                    handleDeleteElementById(selectedId);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, past, future, editingTextId, canvasBg]);

    // Gradient Multi-stop helpers
    const getStops = (bg = canvasBg) => {
        if (bg.stops && bg.stops.length > 0) return bg.stops;
        return [
            { color: bg.color1 || "#111111", offset: 0 },
            { color: bg.color2 || "#333333", offset: 100 }
        ];
    };

    const addGradientStop = (offset, color = "#ffffff") => {
        const currentStops = getStops();
        const updatedStops = [...currentStops, { color, offset }].sort((a, b) => a.offset - b.offset);
        const updatedBg = { ...canvasBg, stops: updatedStops };
        setCanvasBg(updatedBg);
        pushToHistoryState(elementsRef.current, updatedBg);
    };

    const updateGradientStop = (index, key, value) => {
        const currentStops = getStops();
        const updatedStops = currentStops.map((stop, idx) => {
            if (idx === index) return { ...stop, [key]: value };
            return stop;
        });
        const updatedBg = { ...canvasBg, stops: updatedStops.sort((a, b) => a.offset - b.offset) };
        setCanvasBg(updatedBg);
        saveToLocalStorage(elementsRef.current, updatedBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    };

    const removeGradientStop = (index) => {
        const currentStops = getStops();
        if (currentStops.length <= 2) return;
        const updatedStops = currentStops.filter((_, idx) => idx !== index);
        const updatedBg = { ...canvasBg, stops: updatedStops };
        setCanvasBg(updatedBg);
        pushToHistoryState(elementsRef.current, updatedBg);
    };

    // Background compilation helper
    const getCanvasBackgroundCSS = (bg = canvasBg) => {
        if (bg.type === "solid") return bg.color1;
        const stopsStr = getStops(bg).map(s => `${s.color} ${s.offset}%`).join(", ");
        if (bg.type === "linear") {
            const dir = bg.direction === "radial" || bg.direction === "to-b" ? "to bottom" : bg.direction === "to-tr" ? "to top right" : "to right";
            return `linear-gradient(${dir}, ${stopsStr})`;
        }
        if (bg.type === "radial") {
            return `radial-gradient(circle, ${stopsStr})`;
        }
        if (bg.type === "conic") {
            return `conic-gradient(from ${bg.conicAngle || "0deg"} at 50% 50%, ${stopsStr})`;
        }
        if (bg.type === "mesh") {
            const points = bg.meshPoints || [
                { id: "mesh-1", x: bg.p1?.x ?? 10, y: bg.p1?.y ?? 15, color: bg.color1 || "#4f46e5", radius: 65 },
                { id: "mesh-2", x: bg.p2?.x ?? 90, y: bg.p2?.y ?? 10, color: bg.color2 || "#db2777", radius: 65 },
                { id: "mesh-3", x: bg.p3?.x ?? 85, y: bg.p3?.y ?? 85, color: bg.color3 || "#b91c1c", radius: 65 },
                { id: "mesh-4", x: bg.p4?.x ?? 15, y: bg.p4?.y ?? 90, color: bg.color4 || "#065f46", radius: 65 }
            ];
            return points.map(p => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent ${p.radius || 65}%)`).join(", ");
        }
        return bg.color1;
    };

    // Apply Gradient Presets
    const applyPresetGradient = (preset) => {
        const selectedEl = elementsRef.current.find(el => el.id === selectedId);
        if (selectedEl && selectedEl.type === "shape") {
            const updatedElements = elementsRef.current.map(el => {
                if (el.id !== selectedId) return el;
                return {
                    ...el,
                    fillType: "gradient",
                    fillGradient: {
                        type: preset.type,
                        direction: preset.direction || "to-r",
                        conicAngle: preset.conicAngle || "0deg",
                        stops: preset.stops || [
                            { color: preset.color1 || "#ffffff", offset: 0 },
                            { color: preset.color2 || "#000000", offset: 100 }
                        ]
                    }
                };
            });
            setElements(updatedElements);
            pushToHistoryState(updatedElements, canvasBg);
        } else {
            const updated = {
                ...canvasBg,
                type: preset.type,
                direction: preset.direction || "to-r",
                color1: preset.color1 || "#ffffff",
                color2: preset.color2 || "#000000",
                color3: preset.color3 || "#ffffff",
                color4: preset.color4 || "#000000",
                p1: preset.p1 || { x: 10, y: 15 },
                p2: preset.p2 || { x: 90, y: 10 },
                p3: preset.p3 || { x: 85, y: 85 },
                p4: preset.p4 || { x: 15, y: 90 },
                meshPoints: preset.meshPoints || undefined,
                stops: preset.stops || [
                    { color: preset.color1 || "#ffffff", offset: 0 },
                    { color: preset.color2 || "#000000", offset: 100 }
                ]
            };
            setCanvasBg(updated);
            pushToHistoryState(elementsRef.current, updated);
        }
    };

    // Editor initializers
    const handleCreateNew = () => {
        setEditItem(null);
        setTitle("New Autumn Campaign");
        setLinkUrl("/shop");
        setCanvasWidth(380);
        setCanvasHeight(500);
        setElements([
            {
                id: `shape-rect-${Date.now()}`,
                type: "shape",
                shapeType: "rect",
                name: "Base Overlay",
                x: 30,
                y: 30,
                width: 320,
                height: 440,
                fill: "rgba(255,255,255,0.02)",
                stroke: "rgba(255,255,255,0.08)",
                strokeWidth: 1.5,
                zIndex: 1,
                isLocked: false,
                opacity: 100,
                rotate: 0,
                blur: 0,
                shadowX: 0,
                shadowY: 0,
                shadowBlur: 0,
                shadowColor: "rgba(0,0,0,0.5)",
                borderRadius: 24
            },
            {
                id: `text-headline-${Date.now()}`,
                type: "text",
                content: "AUTUMN BLISS\nUP TO 50% OFF",
                x: 60,
                y: 100,
                width: 260,
                height: 80,
                zIndex: 2,
                isLocked: false,
                fontFamily: "Outfit",
                fontSize: 26,
                fontWeight: "black",
                textAlign: "center",
                color: "#ffffff",
                isGradientText: false,
                textGradient: { start: "#ff7e5f", end: "#feb47b", dir: "to-r" },
                opacity: 100,
                rotate: 0,
                shadowX: 0,
                shadowY: 2,
                shadowBlur: 8,
                shadowColor: "rgba(0,0,0,0.3)"
            }
        ]);
        setCanvasBg({
            type: "linear",
            color1: "#fb923c",
            color2: "#db2777",
            direction: "to-tr",
            grainOpacity: 15,
            stops: [
                { color: "#fb923c", offset: 0 },
                { color: "#db2777", offset: 100 }
            ]
        });
        setBorderRadius("2xl");
        setPast([]);
        setFuture([]);
        setShowEditor(true);
    };

    const handleEditCampaign = (item) => {
        setEditItem(item);
        setTitle(item.title);
        setLinkUrl(item.linkUrl || "");
        setBorderRadius(item.borderRadius || "2xl");
        
        let loadedEls = [];
        let loadedBg = {
            type: "solid",
            color1: "#111111",
            color2: "#333333",
            color3: "#4f46e5",
            color4: "#db2777",
            direction: "to-r",
            conicAngle: "0deg",
            grainOpacity: 0,
            p1: { x: 10, y: 15 },
            p2: { x: 90, y: 10 },
            p3: { x: 85, y: 85 },
            p4: { x: 15, y: 90 },
            stops: [
                { color: "#111111", offset: 0 },
                { color: "#333333", offset: 100 }
            ]
        };
        let loadedW = 380;
        let loadedH = 500;
        let loadedTime = item.displayTime || 5;

        let meta = null;
        if (item.metadata) {
            try {
                meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : item.metadata;
            } catch (e) {
                console.error("Failed parsing metadata json", e);
            }
        }

        if (meta && meta.deviceDesigns) {
            setDeviceDesigns(meta.deviceDesigns);
            const dev = "desktop";
            const target = meta.deviceDesigns[dev] || {
                elements: [],
                canvasBg: loadedBg,
                canvasWidth: 800,
                canvasHeight: 500
            };
            loadedEls = target.elements || [];
            loadedBg = target.canvasBg || loadedBg;
            loadedW = target.canvasWidth || 800;
            loadedH = target.canvasHeight || 500;
            if (meta.displayTime) loadedTime = meta.displayTime;
        } else {
            // Setup from meta elements or legacy values
            if (meta) {
                if (meta.elements) loadedEls = meta.elements;
                if (meta.canvasBg) loadedBg = meta.canvasBg;
                if (meta.canvasWidth) loadedW = meta.canvasWidth;
                if (meta.canvasHeight) loadedH = meta.canvasHeight;
                if (meta.displayTime) loadedTime = meta.displayTime;
            } else {
                // Legacy DB fields fallback
                loadedBg = {
                    type: item.isGradient ? (item.gradientDirection === "radial" ? "radial" : "linear") : "solid",
                    color1: item.backgroundColor || "#111111",
                    color2: item.gradientColor || "#333333",
                    color3: "#4f46e5",
                    color4: "#db2777",
                    direction: item.gradientDirection || "to-r",
                    conicAngle: "0deg",
                    grainOpacity: 0,
                    stops: [
                        { color: item.backgroundColor || "#111111", offset: 0 },
                        { color: item.gradientColor || "#333333", offset: 100 }
                    ]
                };
                
                loadedEls = [];
                if (item.imageUrl) {
                    loadedEls.push({
                        id: `image-${Date.now()}`,
                        type: "image",
                        x: 40,
                        y: 100,
                        width: 300,
                        height: 300,
                        url: item.imageUrl,
                        rotate: 0,
                        opacity: 100,
                        zIndex: 1,
                        borderRadius: parseInt(item.borderRadius) || 0,
                        filter: item.imageFilter || { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 },
                        shadowX: 0,
                        shadowY: 4,
                        shadowBlur: 10,
                        shadowColor: "rgba(0,0,0,0.3)"
                    });
                }
                if (item.text && item.text !== "Canvas Compiled Poster") {
                    loadedEls.push({
                        id: `text-${Date.now()}`,
                        type: "text",
                        content: item.text,
                        x: 40,
                        y: 420,
                        width: 300,
                        height: 60,
                        zIndex: 2,
                        fontFamily: "Outfit",
                        fontSize: item.fontSize === "lg" ? 20 : item.fontSize === "xl" ? 24 : item.fontSize === "2xl" ? 28 : item.fontSize === "3xl" ? 32 : item.fontSize === "4xl" ? 36 : 16,
                        fontWeight: item.fontWeight || "bold",
                        textAlign: item.textAlign || "center",
                        color: item.textColor || "#ffffff",
                        isGradientText: false,
                        textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" },
                        opacity: 100,
                        rotate: 0,
                        shadowX: 0,
                        shadowY: 0,
                        shadowBlur: 0,
                        shadowColor: "rgba(0,0,0,0.5)"
                    });
                }
            }

            // Sync legacy config to deviceDesigns
            setDeviceDesigns({
                desktop: { elements: loadedEls, canvasBg: loadedBg, canvasWidth: loadedW || 800, canvasHeight: loadedH || 500 },
                tablet:  { elements: loadedEls.map(el => ({ ...el, x: Math.round(el.x * 540 / (loadedW || 800)), y: Math.round(el.y * 700 / (loadedH || 500)) })), canvasBg: loadedBg, canvasWidth: 540, canvasHeight: 700 },
                mobile:  { elements: loadedEls.map(el => ({ ...el, x: Math.round(el.x * 360 / (loadedW || 800)), y: Math.round(el.y * 640 / (loadedH || 500)) })), canvasBg: loadedBg, canvasWidth: 360, canvasHeight: 640 },
                tv:      { elements: loadedEls.map(el => ({ ...el, x: Math.round(el.x * 1280 / (loadedW || 800)), y: Math.round(el.y * 720 / (loadedH || 500)) })), canvasBg: loadedBg, canvasWidth: 1280, canvasHeight: 720 }
            });
        }
        
        setElements(loadedEls);
        setCanvasBg(loadedBg);
        setCanvasWidth(loadedW);
        setCanvasHeight(loadedH);
        setDisplayTime(loadedTime);
        setSelectedMeshPointId(null);
        setIsFullScreen(false);
        
        loadedEls.forEach(el => {
            if (el.type === "text" && el.fontFamily) {
                loadGoogleFont(el.fontFamily);
            }
        });

        setPast([]);
        setFuture([]);
        setShowEditor(true);
    };

    // Mesh gradient node handlers
    const handleAddMeshPoint = () => {
        setCanvasBg(prev => {
            const points = prev.meshPoints || [
                { id: "mesh-1", x: prev.p1?.x ?? 10, y: prev.p1?.y ?? 15, color: prev.color1 || "#4f46e5", radius: 65 },
                { id: "mesh-2", x: prev.p2?.x ?? 90, y: prev.p2?.y ?? 10, color: prev.color2 || "#db2777", radius: 65 },
                { id: "mesh-3", x: prev.p3?.x ?? 85, y: prev.p3?.y ?? 85, color: prev.color3 || "#b91c1c", radius: 65 },
                { id: "mesh-4", x: prev.p4?.x ?? 15, y: prev.p4?.y ?? 90, color: prev.color4 || "#065f46", radius: 65 }
            ];
            
            const colorsList = ["#ff007f", "#7f00ff", "#00f0ff", "#facc15", "#22c55e", "#3b82f6", "#ef4444"];
            const nextColor = colorsList[points.length % colorsList.length];
            const newPoint = {
                id: `mesh-${Date.now()}`,
                x: 50,
                y: 50,
                color: nextColor,
                radius: 65
            };
            
            const updated = {
                ...prev,
                meshPoints: [...points, newPoint]
            };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            setSelectedMeshPointId(newPoint.id);
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    const handleRemoveMeshPoint = (id) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints || [];
            if (points.length <= 2) return prev;
            const updatedPoints = points.filter(p => p.id !== id);
            const updated = {
                ...prev,
                meshPoints: updatedPoints
            };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            if (updatedPoints.length > 0) {
                setSelectedMeshPointId(updatedPoints[0].id);
            } else {
                setSelectedMeshPointId(null);
            }
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    const handleUpdateMeshPoint = (id, key, value) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints || [
                { id: "mesh-1", x: prev.p1?.x ?? 10, y: prev.p1?.y ?? 15, color: prev.color1 || "#4f46e5", radius: 65 },
                { id: "mesh-2", x: prev.p2?.x ?? 90, y: prev.p2?.y ?? 10, color: prev.color2 || "#db2777", radius: 65 },
                { id: "mesh-3", x: prev.p3?.x ?? 85, y: prev.p3?.y ?? 85, color: prev.color3 || "#b91c1c", radius: 65 },
                { id: "mesh-4", x: prev.p4?.x ?? 15, y: prev.p4?.y ?? 90, color: prev.color4 || "#065f46", radius: 65 }
            ];
            
            const updatedPoints = points.map((p, idx) => {
                if (p.id === id || idx === id) {
                    return { ...p, [key]: key === "radius" ? (parseInt(value) || 10) : value };
                }
                return p;
            });
            
            const updated = {
                ...prev,
                meshPoints: updatedPoints
            };

            const pointIdx = points.findIndex((p, idx) => p.id === id || idx === id);
            if (pointIdx >= 0 && pointIdx < 4) {
                if (key === "color") {
                    updated[`color${pointIdx + 1}`] = value;
                }
            }

            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
    };

    // Add elements methods
    const addTextElement = () => {
        const id = `text-${Date.now()}`;
        const newEl = {
            id,
            type: "text",
            content: "Double Click to Edit",
            x: Math.round((canvasWidth - 200) / 2),
            y: Math.round((canvasHeight - 40) / 2),
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
            textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" },
            opacity: 100,
            rotate: 0,
            shadowX: 0,
            shadowY: 0,
            shadowBlur: 0,
            shadowColor: "rgba(0,0,0,0.5)"
        };
        pushToHistoryState([...elements, newEl]);
        setSelectedId(id);
    };

    const handleAddTextPreset = (preset) => {
        loadGoogleFont(preset.fontFamily);
        const id = `text-${Date.now()}`;
        const newEl = {
            id,
            type: "text",
            content: preset.name,
            x: Math.round((canvasWidth - 200) / 2),
            y: Math.round((canvasHeight - 60) / 2),
            width: 200,
            height: 60,
            zIndex: elements.length + 1,
            isLocked: false,
            fontFamily: preset.fontFamily,
            fontSize: preset.fontSize,
            fontWeight: preset.fontWeight,
            textAlign: "center",
            color: preset.color,
            isGradientText: false,
            textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" },
            opacity: 100,
            rotate: 0,
            shadowX: preset.shadowX || 0,
            shadowY: preset.shadowY || 0,
            shadowBlur: preset.shadowBlur || 0,
            shadowColor: preset.shadowColor || "rgba(0,0,0,0.5)"
        };
        pushToHistoryState([...elements, newEl]);
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
                    x: Math.round((canvasWidth - 260) / 2),
                    y: Math.round((canvasHeight - 180) / 2),
                    width: 260,
                    height: 180,
                    zIndex: elements.length + 1,
                    isLocked: false,
                    opacity: 100,
                    rotate: 0,
                    filter: { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 },
                    borderRadius: 0,
                    shadowX: 0,
                    shadowY: 4,
                    shadowBlur: 10,
                    shadowColor: "rgba(0,0,0,0.3)"
                };
                pushToHistoryState([...elements, newEl]);
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
            x: Math.round((canvasWidth - 260) / 2),
            y: Math.round((canvasHeight - 180) / 2),
            width: 260,
            height: 180,
            zIndex: elements.length + 1,
            isLocked: false,
            opacity: 100,
            rotate: 0,
            filter: { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 },
            borderRadius: 0,
            shadowX: 0,
            shadowY: 4,
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)"
        };
        pushToHistoryState([...elements, newEl]);
        setSelectedId(id);
        setImageLinkInput("");
    };

    const handleAddShape = (shapeKey) => {
        const template = PRESET_SHAPES[shapeKey];
        const id = `${shapeKey}-${Date.now()}`;
        const newEl = {
            id,
            type: "shape",
            shapeType: template.shapeType,
            points: template.points,
            path: template.path,
            name: template.name,
            x: Math.round((canvasWidth - 160) / 2),
            y: Math.round((canvasHeight - 160) / 2),
            width: 160,
            height: 160,
            fill: "#4f46e5",
            stroke: "#312e81",
            strokeWidth: 0,
            zIndex: elements.length + 1,
            isLocked: false,
            opacity: 100,
            rotate: 0,
            blur: 0,
            shadowX: 0,
            shadowY: 4,
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)",
            borderRadius: 0
        };
        pushToHistoryState([...elements, newEl]);
        setSelectedId(id);
    };

    // Interaction triggers: mouse down tracking coordinates
    const handleElementMouseDown = (e, item) => {
        if (isPenMode) return;
        e.stopPropagation();
        setSelectedId(item.id);
        setEditingTextId(null);
        if (item.isLocked) return;

        dragInfo.current = {
            isDragging: true,
            isResizing: false,
            isRotating: false,
            startX: e.clientX,
            startY: e.clientY,
            elementX: item.x,
            elementY: item.y,
            hasMoved: false
        };
        dragStartElements.current = elementsRef.current;

        document.addEventListener("mousemove", handleGlobalDragMouseMove);
        document.addEventListener("mouseup", handleGlobalDragMouseUp);
    };

    const handleGlobalDragMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isDragging) return;

        const dx = (e.clientX - info.startX) / canvasZoom;
        const dy = (e.clientY - info.startY) / canvasZoom;
        if (dx !== 0 || dy !== 0) {
            info.hasMoved = true;
        }

        const grid = snapToGrid ? 8 : 1;
        const newX = Math.round((info.elementX + dx) / grid) * grid;
        const newY = Math.round((info.elementY + dy) / grid) * grid;

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return {
                ...el,
                x: newX,
                y: newY
            };
        }));
    };

    const handleGlobalDragMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalDragMouseMove);
        document.removeEventListener("mouseup", handleGlobalDragMouseUp);
        if (dragInfo.current.hasMoved && dragStartElements.current) {
            setPast(prev => [...prev.slice(-49), { elements: dragStartElements.current, canvasBg: canvasBgRef.current }]);
            setFuture([]);
            saveToLocalStorage(elementsRef.current, canvasBgRef.current, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
        }
    };

    // 8-Direction Resizing Handler
    const handleResizeStart = (e, handle, item) => {
        e.stopPropagation();
        e.preventDefault();
        if (item.isLocked) return;

        dragInfo.current = {
            isDragging: false,
            isResizing: true,
            isRotating: false,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            elementX: item.x,
            elementY: item.y,
            elementW: item.width,
            elementH: item.height,
            hasMoved: false
        };
        dragStartElements.current = elementsRef.current;

        document.addEventListener("mousemove", handleGlobalResizeMouseMove);
        document.addEventListener("mouseup", handleGlobalResizeMouseUp);
    };

    const handleGlobalResizeMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isResizing) return;

        const dx = (e.clientX - info.startX) / canvasZoom;
        const dy = (e.clientY - info.startY) / canvasZoom;
        if (dx !== 0 || dy !== 0) {
            info.hasMoved = true;
        }

        // Get selected element to retrieve rotation angle
        const selectedEl = elementsRef.current.find(el => el.id === selectedId);
        const rotate = selectedEl?.rotate || 0;
        const rad = rotate * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Project world space dx, dy to element's local coordinate axes
        const localDx = dx * cos + dy * sin;
        const localDy = -dx * sin + dy * cos;

        let newW = info.elementW;
        let newH = info.elementH;

        const grid = snapToGrid ? 8 : 1;
        const snap = (val) => Math.round(val / grid) * grid;

        // Calculate new dimensions along local axes
        if (info.handle.includes("e")) {
            newW = Math.max(10, info.elementW + localDx);
        } else if (info.handle.includes("w")) {
            newW = Math.max(10, info.elementW - localDx);
        }

        if (info.handle.includes("s")) {
            newH = Math.max(10, info.elementH + localDy);
        } else if (info.handle.includes("n")) {
            newH = Math.max(10, info.elementH - localDy);
        }

        newW = snap(newW);
        newH = snap(newH);

        // Original center of rotation
        const C0_x = info.elementX + info.elementW / 2;
        const C0_y = info.elementY + info.elementH / 2;

        // Shift calculations based on dimension differences
        const shiftW = (newW - info.elementW) / 2;
        const shiftH = (newH - info.elementH) / 2;

        let factorX = 0;
        if (info.handle.includes("e")) factorX = 1;
        else if (info.handle.includes("w")) factorX = -1;

        let factorY = 0;
        if (info.handle.includes("s")) factorY = 1;
        else if (info.handle.includes("n")) factorY = -1;

        // Relocate the rotated center point relative to the fixed opposite edge
        const C_new_x = C0_x + factorX * shiftW * cos - factorY * shiftH * sin;
        const C_new_y = C0_y + factorX * shiftW * sin + factorY * shiftH * cos;

        // Deduce the new top-left coordinates from the updated center point
        const newX = C_new_x - newW / 2;
        const newY = C_new_y - newH / 2;

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return {
                ...el,
                x: Math.round(newX),
                y: Math.round(newY),
                width: Math.round(newW),
                height: Math.round(newH)
            };
        }));
    };

    const handleGlobalResizeMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalResizeMouseMove);
        document.removeEventListener("mouseup", handleGlobalResizeMouseUp);
        if (dragInfo.current.hasMoved && dragStartElements.current) {
            setPast(prev => [...prev.slice(-49), { elements: dragStartElements.current, canvasBg: canvasBgRef.current }]);
            setFuture([]);
            saveToLocalStorage(elementsRef.current, canvasBgRef.current, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
        }
    };

    // Rotate Interaction Handler
    const handleRotateStart = (e, item) => {
        e.stopPropagation();
        e.preventDefault();
        if (item.isLocked) return;

        const rect = document.getElementById(`element-frame-${item.id}`).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        dragInfo.current = {
            isDragging: false,
            isResizing: false,
            isRotating: true,
            centerX,
            centerY,
            elementR: item.rotate || 0,
            hasMoved: false
        };
        dragStartElements.current = elementsRef.current;

        document.addEventListener("mousemove", handleGlobalRotateMouseMove);
        document.addEventListener("mouseup", handleGlobalRotateMouseUp);
    };

    const handleGlobalRotateMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isRotating) return;

        const dx = e.clientX - info.centerX;
        const dy = e.clientY - info.centerY;
        if (dx !== 0 || dy !== 0) {
            info.hasMoved = true;
        }

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
        if (angle < 0) angle += 360;

        // Shift to snap every 15deg
        if (e.shiftKey) {
            angle = Math.round(angle / 15) * 15;
        } else {
            angle = Math.round(angle);
        }

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return { ...el, rotate: angle };
        }));
    };

    const handleGlobalRotateMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalRotateMouseMove);
        document.removeEventListener("mouseup", handleGlobalRotateMouseUp);
        if (dragInfo.current.hasMoved && dragStartElements.current) {
            setPast(prev => [...prev.slice(-49), { elements: dragStartElements.current, canvasBg: canvasBgRef.current }]);
            setFuture([]);
            saveToLocalStorage(elementsRef.current, canvasBgRef.current, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
        }
    };

    // Pen Drawing Tool interaction
    const handleCanvasClick = (e) => {
        if (isPenMode) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / canvasZoom;
            const y = (e.clientY - rect.top) / canvasZoom;
            setPenPoints([...penPoints, { x, y }]);
        } else {
            if (e.target === e.currentTarget) {
                setSelectedId(null);
                setEditingTextId(null);
            }
        }
    };

    const handleCompletePenPath = () => {
        if (penPoints.length < 2) {
            setIsPenMode(false);
            setPenPoints([]);
            return;
        }

        const xs = penPoints.map(p => p.x);
        const ys = penPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        const width = Math.max(20, maxX - minX);
        const height = Math.max(20, maxY - minY);

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
            name: "Custom Pen Drawing",
            x: minX,
            y: minY,
            width,
            height,
            originalWidth: width,
            originalHeight: height,
            zIndex: elements.length + 1,
            isLocked: false,
            opacity: 100,
            rotate: 0,
            blur: 0,
            shadowX: 0,
            shadowY: 4,
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)"
        };

        pushToHistoryState([...elements, newEl]);
        setSelectedId(id);
        setIsPenMode(false);
        setPenPoints([]);
    };

    // Draggable Mesh Point controls
    const handleMeshPointMouseDown = (e, index) => {
        e.stopPropagation();
        e.preventDefault();

        dragInfo.current = {
            isDraggingMeshPoint: true,
            pointIndex: index,
            hasMoved: false
        };
        dragStartBg.current = canvasBgRef.current;

        document.addEventListener("mousemove", handleGlobalMeshMouseMove);
        document.addEventListener("mouseup", handleGlobalMeshMouseUp);
    };

    const handleGlobalMeshMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isDraggingMeshPoint) return;

        const canvasDom = canvasRef.current;
        if (!canvasDom) return;
        const rect = canvasDom.getBoundingClientRect();

        let rx = ((e.clientX - rect.left) / rect.width) * 100;
        let ry = ((e.clientY - rect.top) / rect.height) * 100;

        rx = Math.max(-20, Math.min(120, Math.round(rx)));
        ry = Math.max(-20, Math.min(120, Math.round(ry)));
        info.hasMoved = true;

        setCanvasBg(prev => {
            const points = prev.meshPoints || [
                { id: "mesh-1", x: prev.p1?.x ?? 10, y: prev.p1?.y ?? 15, color: prev.color1 || "#4f46e5", radius: 65 },
                { id: "mesh-2", x: prev.p2?.x ?? 90, y: prev.p2?.y ?? 10, color: prev.color2 || "#db2777", radius: 65 },
                { id: "mesh-3", x: prev.p3?.x ?? 85, y: prev.p3?.y ?? 85, color: prev.color3 || "#b91c1c", radius: 65 },
                { id: "mesh-4", x: prev.p4?.x ?? 15, y: prev.p4?.y ?? 90, color: prev.color4 || "#065f46", radius: 65 }
            ];

            const updatedPoints = points.map((p, idx) => {
                if (p.id === info.pointIndex || idx === info.pointIndex) {
                    return { ...p, x: rx, y: ry };
                }
                return p;
            });

            const updated = { ...prev, meshPoints: updatedPoints };
            
            // For backwards compatibility
            const pointIdx = points.findIndex((p, idx) => p.id === info.pointIndex || idx === info.pointIndex);
            if (pointIdx >= 0 && pointIdx < 4) {
                updated[`p${pointIdx + 1}`] = { x: rx, y: ry };
            }

            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
    };

    const handleGlobalMeshMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalMeshMouseMove);
        document.removeEventListener("mouseup", handleGlobalMeshMouseUp);
        if (dragInfo.current.hasMoved && dragStartBg.current) {
            setPast(prev => [...prev.slice(-49), { elements: elementsRef.current, canvasBg: dragStartBg.current }]);
            setFuture([]);
            saveToLocalStorage(elementsRef.current, canvasBgRef.current, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
        }
    };

    // Right-Click Context Menu triggers
    const handleCanvasContextMenu = (e, targetId = null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId
        });
    };

    useEffect(() => {
        const closeMenu = () => setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, []);

    // Duplicate Element
    const handleDuplicateElement = (id) => {
        const el = elements.find(item => item.id === id);
        if (!el) return;
        const newId = `${el.type}-${Date.now()}`;
        const newEl = {
            ...el,
            id: newId,
            x: Math.min(canvasWidth - el.width, el.x + 15),
            y: Math.min(canvasHeight - el.height, el.y + 15),
            zIndex: elements.length + 1,
            isLocked: false
        };
        pushToHistoryState([...elements, newEl]);
        setSelectedId(newId);
    };

    // Delete Element
    const handleDeleteElementById = (id) => {
        pushToHistoryState(elements.filter(item => item.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleDeleteElement = () => {
        if (selectedId) handleDeleteElementById(selectedId);
    };

    // Update Elements values
    const updateSelectedElement = (key, value) => {
        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return { ...el, [key]: value };
        }));
        saveToLocalStorage(elementsRef.current, canvasBg, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    };

    const updateSelectedElementAndPush = (key, value) => {
        const updated = elementsRef.current.map(el => {
            if (el.id !== selectedId) return el;
            return { ...el, [key]: value };
        });
        setElements(updated);
        pushToHistoryState(updated, canvasBg);
    };

    // Layer zIndex ordering
    const moveZIndex = (direction) => {
        if (!selectedId) return;
        const index = elements.findIndex(el => el.id === selectedId);
        if (index === -1) return;

        let list = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const itemIdx = list.findIndex(el => el.id === selectedId);

        if (direction === "front") {
            const [item] = list.splice(itemIdx, 1);
            list.push(item);
        } else if (direction === "back") {
            const [item] = list.splice(itemIdx, 1);
            list.unshift(item);
        } else if (direction === "forward" && itemIdx < list.length - 1) {
            const [item] = list.splice(itemIdx, 1);
            list.splice(itemIdx + 1, 0, item);
        } else if (direction === "backward" && itemIdx > 0) {
            const [item] = list.splice(itemIdx, 1);
            list.splice(itemIdx - 1, 0, item);
        }

        // Reassign normalized zIndex: 1..n
        const updated = elements.map(el => {
            const newListIdx = list.findIndex(item => item.id === el.id);
            return { ...el, zIndex: newListIdx + 1 };
        });

        pushToHistoryState(updated);
    };

    // Mesh gradient node layering ordering (Front/Back)
    const handleMoveMeshPointUp = (id) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints ? [...prev.meshPoints] : [];
            const idx = points.findIndex((p, i) => p.id === id || i === id);
            if (idx === -1 || idx === points.length - 1) return prev;
            
            const temp = points[idx];
            points[idx] = points[idx + 1];
            points[idx + 1] = temp;
            
            const updated = { ...prev, meshPoints: points };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    const handleMoveMeshPointDown = (id) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints ? [...prev.meshPoints] : [];
            const idx = points.findIndex((p, i) => p.id === id || i === id);
            if (idx === -1 || idx === 0) return prev;
            
            const temp = points[idx];
            points[idx] = points[idx - 1];
            points[idx - 1] = temp;
            
            const updated = { ...prev, meshPoints: points };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    const handleMoveMeshPointFront = (id) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints ? [...prev.meshPoints] : [];
            const idx = points.findIndex((p, i) => p.id === id || i === id);
            if (idx === -1 || idx === points.length - 1) return prev;
            
            const target = points[idx];
            const filtered = points.filter((_, i) => i !== idx);
            filtered.push(target);
            
            const updated = { ...prev, meshPoints: filtered };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    const handleMoveMeshPointBack = (id) => {
        setCanvasBg(prev => {
            const points = prev.meshPoints ? [...prev.meshPoints] : [];
            const idx = points.findIndex((p, i) => p.id === id || i === id);
            if (idx === -1 || idx === 0) return prev;
            
            const target = points[idx];
            const filtered = points.filter((_, i) => i !== idx);
            filtered.unshift(target);
            
            const updated = { ...prev, meshPoints: filtered };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl, canvasWidth, canvasHeight, displayTime);
            return updated;
        });
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
    };

    // Align controls relative to canvas bounds
    const handleAlign = (direction) => {
        if (!selectedId) return;
        const el = elements.find(item => item.id === selectedId);
        if (!el || el.isLocked) return;

        let newX = el.x;
        let newY = el.y;

        if (direction === "left") newX = 0;
        if (direction === "h_center") newX = Math.round((canvasWidth - el.width) / 2);
        if (direction === "right") newX = canvasWidth - el.width;
        if (direction === "top") newY = 0;
        if (direction === "v_center") newY = Math.round((canvasHeight - el.height) / 2);
        if (direction === "bottom") newY = canvasHeight - el.height;

        pushToHistoryState(elements.map(item => {
            if (item.id === selectedId) {
                return { ...item, x: newX, y: newY };
            }
            return item;
        }));
    };

    // html2canvas-pro Compile & Save Pipeline
    const handleCompileAndSave = async (isPublishing = false) => {
        setSelectedId(null);
        setEditingTextId(null);
        
        await new Promise(r => setTimeout(r, 120));

        try {
            // Update designs first to capture active design
            const updatedDesigns = {
                ...deviceDesigns,
                [activeDevice]: {
                    elements,
                    canvasBg,
                    canvasWidth,
                    canvasHeight
                }
            };

            const payloadData = {
                deviceDesigns: updatedDesigns,
                displayTime
            };

            const data = new FormData();
            data.append("title", title);
            data.append("text", "Canvas Compiled Poster");
            data.append("isActive", isPublishing ? "true" : editItem ? String(editItem.isActive) : "false");
            data.append("isDraft", isPublishing ? "false" : "true");
            data.append("metadata", JSON.stringify(payloadData));
            data.append("displayTime", String(displayTime));
            data.append("borderRadius", borderRadius);
            data.append("linkUrl", linkUrl);

            if (isPublishing) {
                const capturedDeviceImages = {};
                const devicesList = [
                    { key: "desktop", ref: desktopCanvasRef, width: deviceDesigns.desktop.canvasWidth, height: deviceDesigns.desktop.canvasHeight },
                    { key: "tablet", ref: tabletCanvasRef, width: deviceDesigns.tablet.canvasWidth, height: deviceDesigns.tablet.canvasHeight },
                    { key: "mobile", ref: mobileCanvasRef, width: deviceDesigns.mobile.canvasWidth, height: deviceDesigns.mobile.canvasHeight },
                    { key: "tv", ref: tvCanvasRef, width: deviceDesigns.tv.canvasWidth, height: deviceDesigns.tv.canvasHeight }
                ];

                for (const dev of devicesList) {
                    if (dev.ref.current) {
                        const canvas = await html2canvas(dev.ref.current, {
                            useCORS: true,
                            backgroundColor: null,
                            width: dev.width,
                            height: dev.height,
                            scale: 1.5
                        });
                        const base64 = canvas.toDataURL("image/png", 0.90);
                        capturedDeviceImages[dev.key] = base64;
                    }
                }

                // Standard desktop screenshot for the primary 'image' field
                const mainCanvas = await html2canvas(desktopCanvasRef.current || canvasRef.current, {
                    useCORS: true,
                    backgroundColor: null,
                    width: deviceDesigns.desktop.canvasWidth,
                    height: deviceDesigns.desktop.canvasHeight,
                    scale: 1.5
                });
                const mainBlob = await new Promise(resolve => mainCanvas.toBlob(resolve, "image/png", 0.95));
                const imageFile = new File([mainBlob], `${title.replace(/ /g, "_")}-desktop-${Date.now()}.png`, { type: "image/png" });

                data.append("image", imageFile);
                data.append("deviceImages", JSON.stringify(capturedDeviceImages));
            } else {
                // For draft saves, keep existing images if editing
                if (editItem) {
                    if (editItem.imageUrl) data.append("imageUrl", editItem.imageUrl);
                    if (editItem.deviceImages) {
                        const devImg = typeof editItem.deviceImages === "string" ? editItem.deviceImages : JSON.stringify(editItem.deviceImages);
                        data.append("deviceImages", devImg);
                    }
                }
            }

            if (editItem) {
                await handleUpdatePopup(editItem._id, data);
            } else {
                await handleCreatePopup(data);
            }
            
            // Clean local storage draft upon clean compilation saves
            localStorage.removeItem("snitch_popup_canvas_draft_v2");
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
        setPast([]);
        setFuture([]);
        setDisplayTime(5);
        setSelectedMeshPointId(null);
        setIsFullScreen(false);
        setActiveDevice("desktop");
        setDeviceDesigns({
            desktop: { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 800, canvasHeight: 500 },
            tablet:  { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 540, canvasHeight: 700 },
            mobile:  { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 360, canvasHeight: 640 },
            tv:      { elements: [], canvasBg: { type: "solid", color1: "#111111", stops: [{ color: "#111111", offset: 0 }, { color: "#333333", offset: 100 }] }, canvasWidth: 1280, canvasHeight: 720 }
        });
        setCanvasOffset({ x: 0, y: 0 });
        setCanvasZoom(1);
    };

    const handleDeleteCampaign = () => {
        if (deleteModal.id) {
            handleDeletePopup(deleteModal.id);
        }
        setDeleteModal({ isOpen: false, id: null });
    };

    // Filters formatting helper
    const getImageFilterStyle = (f) => {
        if (!f) return {};
        return {
            filter: `blur(${f.blur || 0}px) brightness(${f.brightness || 100}%) contrast(${f.contrast || 100}%) grayscale(${f.grayscale || 0}%) sepia(${f.sepia || 0}%)`
        };
    };

    const selectedItem = elements.find(el => el.id === selectedId);

    function updateSelectedElementState(id, key, value) {
        const updated = elementsRef.current.map(item => {
            if (item.id === id) return { ...item, [key]: value };
            return item;
        });
        setElements(updated);
        saveToLocalStorage(updated, canvasBgRef.current, borderRadius, title, linkUrl, canvasWidth, canvasHeight);
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {loading && <PageLoader />}

            {!showEditor ? (
                <>
                    {/* List View */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-accent uppercase">Marketing Desk</span>
                            <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Popup Canvas</h1>
                            <p className="text-foreground/40 mt-2">Design visual posters using pen drawings, mesh gradients, Google Fonts, and filters, and broadcast them instantly.</p>
                        </div>
                        <div className="flex gap-2">
                            {hasLocalStorageBackup() && (
                                <button
                                    onClick={() => {
                                        restoreDraft();
                                        setShowEditor(true);
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase hover:bg-white/10 tracking-wider flex items-center gap-1.5 cursor-pointer text-white"
                                >
                                    <i className="ri-history-line text-sm" /> Restore Backup
                                </button>
                            )}
                            <PrimaryBtn icon="ri-paint-brush-line" onClick={handleCreateNew}>Create Poster</PrimaryBtn>
                        </div>
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
                                        <p className="text-xs font-black text-foreground mt-0.5">Auto-closes in {popup.displayTime || 5} seconds</p>
                                        <p className="text-[8px] font-bold text-foreground/45 mt-1 truncate">Redirect URL: {popup.linkUrl || "None"}</p>
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
                /* Figma-Style studio editor view */
                (() => {
                    const editorJSX = (
                        <div className={`flex flex-col bg-[#121214] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 text-white ${isFullScreen ? "fixed inset-0 w-screen h-screen z-[99999] rounded-none border-none m-0 p-0" : "h-[85vh] border border-white/10 rounded-[32px]"}`}>
                    {/* Editor Header Bar */}
                    <div className="p-4 bg-[#18181c] border-b border-white/5 flex items-center justify-between flex-wrap gap-4 z-50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetForm}
                                className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer text-white/60 transition-colors"
                                title="Exit Studio"
                            >
                                <i className="ri-arrow-left-line text-sm" />
                            </button>
                            <input 
                                value={title} 
                                onChange={e => {
                                    setTitle(e.target.value);
                                    saveToLocalStorage(elements, canvasBg, borderRadius, e.target.value, linkUrl, canvasWidth, canvasHeight);
                                }} 
                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-accent text-sm font-black uppercase outline-none px-1 py-0.5 max-w-[200px]" 
                                placeholder="Poster Title..."
                            />
                            
                            {/* Undo / Redo / Fullscreen buttons */}
                            <div className="h-4 w-[1px] bg-white/10 mx-2" />
                            <div className="flex gap-1 items-center">
                                <button
                                    onClick={handleUndo}
                                    disabled={past.length === 0}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${past.length > 0 ? "hover:bg-white/5 text-white cursor-pointer" : "text-white/20 cursor-default"}`}
                                    title="Undo (Ctrl+Z)"
                                >
                                    <i className="ri-arrow-go-back-line text-sm" />
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={future.length === 0}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${future.length > 0 ? "hover:bg-white/5 text-white cursor-pointer" : "text-white/20 cursor-default"}`}
                                    title="Redo (Ctrl+Y)"
                                >
                                    <i className="ri-arrow-go-forward-line text-sm" />
                                </button>
                                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-white cursor-pointer transition-all"
                                    title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                                >
                                    <i className={isFullScreen ? "ri-fullscreen-exit-line text-sm text-accent" : "ri-fullscreen-line text-sm"} />
                                </button>
                            </div>
                        </div>

                        {/* Pen Drawing Indicator Overlay */}
                        {isPenMode && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full animate-pulse flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                Drawing Mode: Click canvas to trace nodes. Double-click canvas or click done to save.
                            </span>
                        )}

                        {/* Top controls toolbox */}
                        <div className="flex items-center gap-1.5 bg-[#1f1f24] border border-white/5 p-1 rounded-xl">
                            <button
                                onClick={addTextElement}
                                className="px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                                title="Insert New Text Block"
                            >
                                <i className="ri-text text-xs" /> Text
                            </button>
                            
                            <div className="relative">
                                <button
                                    onClick={() => document.getElementById("canvas-image-upload").click()}
                                    className="px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                                    title="Upload Local Graphic Asset"
                                >
                                    <i className="ri-image-add-line text-xs" /> Image
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
                                onClick={() => {
                                    setIsPenMode(!isPenMode);
                                    setPenPoints([]);
                                    setSelectedId(null);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border flex items-center gap-1 transition-all
                                    ${isPenMode ? "bg-accent border-accent text-accent-content" : "border-transparent hover:bg-white/5"}`}
                                title="Freehand SVG Polygon Pen Tool"
                            >
                                <i className="ri-pen-nib-line text-xs" /> Pen Draw
                            </button>
                            {isPenMode && penPoints.length >= 2 && (
                                <button
                                    onClick={handleCompletePenPath}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                    Complete Shape
                                </button>
                            )}
                        </div>

                        {/* Device Responsive Tabs */}
                        <div className="flex gap-1 bg-[#1f1f24] border border-white/5 rounded-xl p-1">
                            {[
                                { key: "tv",      label: "TV",      icon: "ri-tv-line" },
                                { key: "desktop", label: "Desktop", icon: "ri-computer-line" },
                                { key: "tablet",  label: "Tablet",  icon: "ri-tablet-line" },
                                { key: "mobile",  label: "Mobile",  icon: "ri-smartphone-line" },
                            ].map(d => (
                                <button
                                    key={d.key}
                                    onClick={() => switchDevice(d.key)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        activeDevice === d.key
                                            ? "bg-accent text-accent-content"
                                            : "text-white/45 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <i className={d.icon} />
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* Zoom Panning Toolbar */}
                        <div className="flex items-center gap-1.5 bg-[#1f1f24] border border-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setCanvasZoom(z => Math.max(0.1, z - 0.1))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 cursor-pointer"
                                title="Zoom Out"
                            >
                                <i className="ri-subtract-line text-xs" />
                            </button>
                            <span className="text-[9px] font-black font-mono text-white/50 w-8 text-center">{Math.round(canvasZoom * 100)}%</span>
                            <button
                                onClick={() => setCanvasZoom(z => Math.min(4, z + 0.1))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 cursor-pointer"
                                title="Zoom In"
                            >
                                <i className="ri-add-line text-xs" />
                            </button>
                            <button
                                onClick={() => { setCanvasOffset({ x: 0, y: 0 }); setCanvasZoom(1); }}
                                className="px-2 py-1 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-wider cursor-pointer"
                                title="Reset Zoom & Pan"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Save Actions */}
                        <div className="flex gap-2">
                            {/* Snapping Toggle */}
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-[10px]">
                                <input 
                                    type="checkbox" 
                                    id="snapToGrid" 
                                    checked={snapToGrid} 
                                    onChange={e => setSnapToGrid(e.target.checked)} 
                                    className="w-3.5 h-3.5 accent-accent"
                                />
                                <label htmlFor="snapToGrid" className="text-[8px] font-black uppercase tracking-wider cursor-pointer select-none">Snap (8px)</label>
                            </div>
                            
                            {/* Eye Preview button */}
                            <button
                                onClick={() => setShowPreview(true)}
                                className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer text-white/60 transition-colors"
                                title="Preview Live Popup View"
                            >
                                <i className="ri-eye-line text-sm" />
                            </button>

                            <button
                                onClick={() => handleCompileAndSave(false)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 rounded-xl cursor-pointer"
                            >
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleCompileAndSave(true)}
                                className="px-4 py-2 bg-accent text-accent-content hover:bg-accent/90 text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-md"
                            >
                                Publish Live ⚡
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Frame */}
                    <div className="flex-grow flex overflow-hidden">
                        
                        {/* Modular Left Sidebar */}
                        <LeftSidebar 
                            elements={elements}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            canvasBg={canvasBg}
                            setCanvasBg={setCanvasBg}
                            activeSidebarTab={activeSidebarTab}
                            setActiveSidebarTab={setActiveSidebarTab}
                            updateSelectedElementState={updateSelectedElementState}
                            handleDeleteElementById={handleDeleteElementById}
                            moveZIndex={moveZIndex}
                            handleAddTextPreset={handleAddTextPreset}
                            handleAddShape={handleAddShape}
                            applyPresetGradient={applyPresetGradient}
                            addGradientStop={addGradientStop}
                            updateGradientStop={updateGradientStop}
                            removeGradientStop={removeGradientStop}
                            getStops={getStops}
                            getCanvasBackgroundCSS={getCanvasBackgroundCSS}
                            imageLinkInput={imageLinkInput}
                            setImageLinkInput={setImageLinkInput}
                            handleAddImageLink={handleAddImageLink}
                            pushToHistoryState={pushToHistoryState}
                            elementsRef={elementsRef}
                            canvasBgRef={canvasBgRef}
                        />

                        {/* Interactive Center Workbench Area */}
                        <div 
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setSelectedId(null);
                                    setEditingTextId(null);
                                }
                            }}
                            onContextMenu={(e) => handleCanvasContextMenu(e)}
                            onMouseDown={(e) => {
                                if (isSpaceHeld || e.button === 1) {
                                    e.preventDefault();
                                    const startX = e.clientX - canvasOffset.x;
                                    const startY = e.clientY - canvasOffset.y;
                                    
                                    const handleMouseMove = (moveEvent) => {
                                        setCanvasOffset({
                                            x: moveEvent.clientX - startX,
                                            y: moveEvent.clientY - startY
                                        });
                                    };
                                    
                                    const handleMouseUp = () => {
                                        document.removeEventListener("mousemove", handleMouseMove);
                                        document.removeEventListener("mouseup", handleMouseUp);
                                    };
                                    
                                    document.addEventListener("mousemove", handleMouseMove);
                                    document.addEventListener("mouseup", handleMouseUp);
                                }
                            }}
                            onWheel={(e) => {
                                if (e.ctrlKey) {
                                    e.preventDefault();
                                    const zoomFactor = 1.1;
                                    let newZoom = canvasZoom;
                                    if (e.deltaY < 0) {
                                        newZoom = Math.min(4, canvasZoom * zoomFactor);
                                    } else {
                                        newZoom = Math.max(0.1, canvasZoom / zoomFactor);
                                    }
                                    setCanvasZoom(newZoom);
                                } else {
                                    e.preventDefault();
                                    const speed = 1.2;
                                    if (e.shiftKey) {
                                        setCanvasOffset(prev => ({ ...prev, x: prev.x - e.deltaY * speed }));
                                    } else {
                                        setCanvasOffset(prev => ({ ...prev, y: prev.y - e.deltaY * speed }));
                                    }
                                }
                            }}
                            className={`flex-1 bg-[#0e0e10] flex items-center justify-center p-6 relative overflow-hidden select-none ${isSpaceHeld ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                            style={{
                                backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                                backgroundSize: "16px 16px"
                            }}
                        >
                            {/* Bounding Canvas limits */}
                            <div
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className={`relative shadow-2xl border border-white/5 shrink-0 select-none transition-shadow duration-300
                                    ${clipContent ? "overflow-hidden" : "overflow-visible"}
                                    ${isPenMode ? "cursor-crosshair" : "cursor-default"}`}
                                style={{
                                    width: `${canvasWidth}px`,
                                    height: `${canvasHeight}px`,
                                    background: getCanvasBackgroundCSS(),
                                    borderRadius: borderRadius === "none" ? "0px" : borderRadius === "md" ? "12px" : borderRadius === "lg" ? "16px" : borderRadius === "full" ? "40px" : "24px",
                                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
                                    transformOrigin: "center center"
                                }}
                            >
                                {/* Vector Render Elements */}
                                {elements.map((el) => {
                                    if (el.hidden) return null;
                                    return (
                                        <CanvasElement
                                            key={el.id}
                                            el={el}
                                            selectedId={selectedId}
                                            editingTextId={editingTextId}
                                            isPenMode={isPenMode}
                                            setSelectedId={setSelectedId}
                                            setEditingTextId={setEditingTextId}
                                            handleElementMouseDown={handleElementMouseDown}
                                            handleResizeStart={handleResizeStart}
                                            handleRotateStart={handleRotateStart}
                                            handleCanvasContextMenu={handleCanvasContextMenu}
                                            updateSelectedElement={updateSelectedElement}
                                            pushToHistoryState={pushToHistoryState}
                                            elements={elements}
                                        />
                                    );
                                })}

                                {/* Dynamic SVG Noise / Grain Overlay */}
                                {canvasBg.grainOpacity > 0 && (
                                    <div 
                                        className="absolute inset-0 pointer-events-none mix-blend-overlay z-[1999]"
                                        style={{
                                            opacity: (canvasBg.grainOpacity || 0) / 100,
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0%200%20200%20200'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noiseFilter'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.8'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                        }}
                                    />
                                )}

                                {/* SVG Overlay when drawing with Pen Tool */}
                                {isPenMode && (
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[999]">
                                        {penPoints.map((pt, idx) => (
                                            <circle key={idx} cx={pt.x} cy={pt.y} r={4} fill="#db2777" stroke="#ffffff" strokeWidth={1.5} />
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

                            {/* Mesh Gradient Control Handles overlay */}
                            {canvasBg.type === "mesh" && (
                                <div 
                                    className="absolute pointer-events-none shrink-0 overflow-visible z-[2000]"
                                    style={{ 
                                        width: `${canvasWidth}px`, 
                                        height: `${canvasHeight}px`,
                                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
                                        transformOrigin: "center center"
                                    }}
                                >
                                    {(() => {
                                        const points = canvasBg.meshPoints || [
                                            { id: "mesh-1", x: canvasBg.p1?.x ?? 10, y: canvasBg.p1?.y ?? 15, color: canvasBg.color1 || "#4f46e5", radius: 65 },
                                            { id: "mesh-2", x: canvasBg.p2?.x ?? 90, y: canvasBg.p2?.y ?? 10, color: canvasBg.color2 || "#db2777", radius: 65 },
                                            { id: "mesh-3", x: canvasBg.p3?.x ?? 85, y: canvasBg.p3?.y ?? 85, color: canvasBg.color3 || "#b91c1c", radius: 65 },
                                            { id: "mesh-4", x: canvasBg.p4?.x ?? 15, y: canvasBg.p4?.y ?? 90, color: canvasBg.color4 || "#065f46", radius: 65 }
                                        ];
                                        return points.map((p, idx) => (
                                            <div
                                                key={p.id || idx}
                                                onMouseDown={(e) => handleMeshPointMouseDown(e, p.id || idx)}
                                                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                                className={`w-6 h-6 rounded-full absolute -translate-x-1/2 -translate-y-1/2 bg-[#1b1b1f] border-2 pointer-events-auto shadow-2xl flex items-center justify-center cursor-move hover:scale-110 transition-transform active:scale-95 z-[2005] ${
                                                    (selectedMeshPointId === p.id || selectedMeshPointId === idx) ? "border-accent scale-110 shadow-[0_0_12px_rgba(251,191,36,0.6)]" : "border-white"
                                                }`}
                                                title={`Drag Mesh Point ${idx + 1}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedMeshPointId(p.id || idx);
                                                }}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-white/50 shadow" style={{ backgroundColor: p.color }} />
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Modular Right Sidebar property inspector */}
                        <RightSidebar 
                            selectedItem={selectedItem}
                            updateSelectedElement={updateSelectedElement}
                            updateSelectedElementAndPush={updateSelectedElementAndPush}
                            handleDeleteElement={handleDeleteElement}
                            handleAlign={handleAlign}
                            popularFonts={popularFonts}
                            loadGoogleFont={loadGoogleFont}
                            borderRadius={borderRadius}
                            setBorderRadius={setBorderRadius}
                            title={title}
                            setTitle={setTitle}
                            linkUrl={linkUrl}
                            setLinkUrl={setLinkUrl}
                            canvasBg={canvasBg}
                            setCanvasBg={setCanvasBg}
                            elements={elements}
                            pushToHistoryState={pushToHistoryState}
                            addGradientStop={addGradientStop}
                            updateGradientStop={updateGradientStop}
                            removeGradientStop={removeGradientStop}
                            getStops={getStops}
                            getCanvasBackgroundCSS={getCanvasBackgroundCSS}
                            canvasSizes={CANVAS_SIZES}
                            canvasWidth={canvasWidth}
                            setCanvasWidth={setCanvasWidth}
                            canvasHeight={canvasHeight}
                            setCanvasHeight={setCanvasHeight}
                            saveToLocalStorage={saveToLocalStorage}
                            canvasBgRef={canvasBgRef}
                            displayTime={displayTime}
                            setDisplayTime={setDisplayTime}
                            selectedMeshPointId={selectedMeshPointId}
                            setSelectedMeshPointId={setSelectedMeshPointId}
                            handleAddMeshPoint={handleAddMeshPoint}
                            handleRemoveMeshPoint={handleRemoveMeshPoint}
                            handleUpdateMeshPoint={handleUpdateMeshPoint}
                            handleMoveMeshPointUp={handleMoveMeshPointUp}
                            handleMoveMeshPointDown={handleMoveMeshPointDown}
                            handleMoveMeshPointFront={handleMoveMeshPointFront}
                            handleMoveMeshPointBack={handleMoveMeshPointBack}
                            clipContent={clipContent}
                            setClipContent={setClipContent}
                        />

                    </div>
                </div>
            );
            return isFullScreen ? createPortal(editorJSX, document.body) : editorJSX;
        })()
    )}

            {/* Offscreen hidden canvases for compiling all 4 devices */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", pointerEvents: "none" }} aria-hidden="true">
                {["desktop", "tablet", "mobile", "tv"].map(deviceKey => {
                    const design = deviceDesigns[deviceKey] || {};
                    const devWidth = design.canvasWidth || 800;
                    const devHeight = design.canvasHeight || 500;
                    const devBg = design.canvasBg || { type: "solid", color1: "#111111" };
                    const devElements = design.elements || [];
                    const ref = deviceKey === "desktop" ? desktopCanvasRef : deviceKey === "tablet" ? tabletCanvasRef : deviceKey === "mobile" ? mobileCanvasRef : tvCanvasRef;
                    
                    return (
                        <div
                            key={deviceKey}
                            ref={ref}
                            style={{
                                width: `${devWidth}px`,
                                height: `${devHeight}px`,
                                background: getCanvasBackgroundCSS(devBg),
                                borderRadius: borderRadius === "none" ? "0px" : borderRadius === "md" ? "12px" : borderRadius === "lg" ? "16px" : borderRadius === "full" ? "40px" : "24px",
                                position: "relative",
                                overflow: "hidden"
                            }}
                        >
                            {devElements.map((el) => {
                                if (el.hidden) return null;
                                return (
                                    <CanvasElement
                                        key={el.id}
                                        el={el}
                                        selectedId={null}
                                        editingTextId={null}
                                        isPenMode={false}
                                        setSelectedId={() => {}}
                                        setEditingTextId={() => {}}
                                        handleElementMouseDown={() => {}}
                                        handleResizeStart={() => {}}
                                        handleRotateStart={() => {}}
                                        handleCanvasContextMenu={() => {}}
                                        updateSelectedElement={() => {}}
                                        pushToHistoryState={() => {}}
                                        elements={devElements}
                                    />
                                );
                            })}
                            {devBg.grainOpacity > 0 && (
                                <div 
                                    className="absolute inset-0 pointer-events-none mix-blend-overlay z-[1999]"
                                    style={{
                                        opacity: (devBg.grainOpacity || 0) / 100,
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0%200%20200%20200'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noiseFilter'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.8'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom right-click Context Menu overlay */}
            {contextMenu.visible && (
                <ContextMenu 
                    x={contextMenu.x}
                    y={contextMenu.y}
                    targetId={contextMenu.targetId}
                    elements={elements}
                    moveZIndex={moveZIndex}
                    updateSelectedElementState={updateSelectedElementState}
                    handleDuplicateElement={handleDuplicateElement}
                    handleDeleteElementById={handleDeleteElementById}
                    addTextElement={addTextElement}
                    handleAddShape={handleAddShape}
                />
            )}

            {/* Delete Modal Confirmation dialog */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteCampaign}
                title="Deconstruct Campaign"
                description="Are you sure you want to permanently delete this visual campaign? This action is irreversible."
                type="danger"
                confirmText="Confirm Delete"
                cancelText="Cancel"
            />

            {/* Eye Icon Popup Preview Overlay Modal */}
            {showPreview && (
                <PopupPreview
                    deviceDesigns={deviceDesigns}
                    title={title}
                    linkUrl={linkUrl}
                    displayTime={displayTime}
                    borderRadius={borderRadius}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};

export default AdminPopupsPage;
