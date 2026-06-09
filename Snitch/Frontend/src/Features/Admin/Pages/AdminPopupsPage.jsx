import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { usePopup } from "../Hooks/usePopup";
import { PrimaryBtn, SecondaryBtn } from "../../Components/Buttons";
import Modal from "../../Components/Modal";
import PageLoader from "../../Components/PageLoader";
import { AdminTaxonomySkeleton } from "../../Components/Skeletons";
import html2canvas from "html2canvas";

// 22 Custom Preset Shapes Library (above 20 shapes)
const PRESET_SHAPES = {
    rect: { name: "Rectangle", type: "shape", shapeType: "rect" },
    circle: { name: "Circle", type: "shape", shapeType: "circle" },
    triangle: { name: "Triangle", type: "shape", shapeType: "polygon", points: "50,0 100,100 0,100" },
    rhombus: { name: "Rhombus", type: "shape", shapeType: "polygon", points: "50,0 100,50 50,100 0,50" },
    hexagon: { name: "Hexagon", type: "shape", shapeType: "polygon", points: "50,0 93,25 93,75 50,100 7,75 7,25" },
    pentagon: { name: "Pentagon", type: "shape", shapeType: "polygon", points: "50,0 98,35 80,90 20,90 2,35" },
    octagon: { name: "Octagon", type: "shape", shapeType: "polygon", points: "30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" },
    parallelogram: { name: "Parallelogram", type: "shape", shapeType: "polygon", points: "25,0 100,0 75,100 0,100" },
    trapezoid: { name: "Trapezoid", type: "shape", shapeType: "polygon", points: "20,0 80,0 100,100 0,100" },
    arrow_r: { name: "Arrow Right", type: "shape", shapeType: "polygon", points: "0,35 60,35 60,10 100,50 60,90 60,65 0,65" },
    arrow_l: { name: "Arrow Left", type: "shape", shapeType: "polygon", points: "40,10 40,35 100,35 100,65 40,65 40,90 0,50" },
    arrow_u: { name: "Arrow Up", type: "shape", shapeType: "polygon", points: "50,0 100,40 65,40 65,100 35,100 35,40 0,40" },
    arrow_d: { name: "Arrow Down", type: "shape", shapeType: "polygon", points: "35,0 65,0 65,60 100,60 50,100 0,60 35,60" },
    cross: { name: "Plus Cross", type: "shape", shapeType: "polygon", points: "35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35" },
    star_5: { name: "5-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L63,38 L100,38 L70,61 L82,100 L50,75 L18,100 L30,61 L0,38 L37,38 Z" },
    star_6: { name: "6-Pt Star", type: "shape", shapeType: "polygon", points: "50,0 65,30 100,30 80,55 90,90 50,70 10,90 20,55 0,30 35,30" },
    star_8: { name: "8-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L62,35 L95,35 L70,55 L80,88 L50,70 L20,88 L30,55 L5,35 L38,35 Z" },
    heart: { name: "Heart", type: "shape", shapeType: "path", path: "M50,18 C35,0 0,0 0,35 C0,65 50,95 50,95 C50,95 100,65 100,35 C100,0 65,0 50,18 Z" },
    speech: { name: "Speech Bubble", type: "shape", shapeType: "path", path: "M10,0 L90,0 C95,0 100,5 100,10 L100,60 C100,65 95,70 90,70 L45,70 L25,90 L25,70 L10,70 C5,70 0,65 0,60 L0,10 C0,5 5,0 10,0 Z" },
    shield: { name: "Shield", type: "shape", shapeType: "path", path: "M0,15 L50,0 L100,15 L100,60 C100,85 50,100 50,100 C50,100 0,85 0,60 Z" },
    crescent: { name: "Crescent Moon", type: "shape", shapeType: "path", path: "M50,0 C20,0 0,25 0,55 C0,85 25,100 50,100 C30,90 20,70 20,50 C20,30 30,10 50,0 Z" },
    badge: { name: "Burst Badge", type: "shape", shapeType: "polygon", points: "50,0 60,10 70,0 80,10 90,0 100,10 90,20 100,30 90,40 100,50 90,60 100,70 90,80 100,90 90,100 80,90 70,100 60,90 50,100 40,90 30,100 20,90 10,100 0,90 10,80 0,70 10,60 0,50 10,40 0,30 10,20 0,10 10,0 20,10 30,0 40,10" }
};

// Preset Design Backgrounds
const PRESET_GRADIENTS = [
    {
        name: "Neon Midnight",
        type: "mesh",
        color1: "#0a0a16",
        color2: "#4f46e5",
        color3: "#b91c1c",
        color4: "#065f46",
        p1: { x: 10, y: 15 },
        p2: { x: 90, y: 10 },
        p3: { x: 85, y: 85 },
        p4: { x: 15, y: 90 }
    },
    {
        name: "Sunset Glow",
        type: "linear",
        direction: "to-r",
        stops: [
            { color: "#f97316", offset: 0 },
            { color: "#ec4899", offset: 50 },
            { color: "#8b5cf6", offset: 100 }
        ]
    },
    {
        name: "Royal Emerald",
        type: "linear",
        direction: "to-tr",
        stops: [
            { color: "#064e3b", offset: 0 },
            { color: "#059669", offset: 50 },
            { color: "#34d399", offset: 100 }
        ]
    },
    {
        name: "Cherry Blossom",
        type: "radial",
        stops: [
            { color: "#fce7f3", offset: 0 },
            { color: "#f472b6", offset: 60 },
            { color: "#db2777", offset: 100 }
        ]
    },
    {
        name: "Golden Hour",
        type: "linear",
        direction: "to-b",
        stops: [
            { color: "#fef08a", offset: 0 },
            { color: "#f59e0b", offset: 100 }
        ]
    },
    {
        name: "Dark Glass",
        type: "solid",
        color1: "#121214"
    }
];

// Styled Typography Presets
const TEXT_PRESETS = [
    { name: "Big Headline", fontSize: 36, fontWeight: "black", fontFamily: "Cabinet Grotesk", color: "#ffffff" },
    { name: "Neon Glow", fontSize: 26, fontWeight: "bold", fontFamily: "Syne", color: "#ff007f", shadowX: 0, shadowY: 0, shadowBlur: 15, shadowColor: "#ff007f" },
    { name: "Poster Subhead", fontSize: 20, fontWeight: "bold", fontFamily: "Outfit", color: "#60a5fa" },
    { name: "Caption Details", fontSize: 11, fontWeight: "normal", fontFamily: "Inter", color: "#a1a1aa" }
];

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

    // Infinite canvas workspace references
    const canvasRef = useRef(null);
    const [canvasBg, setCanvasBg] = useState({
        type: "solid",
        color1: "#111111",
        color2: "#333333",
        color3: "#4f46e5",
        color4: "#db2777",
        direction: "to-r",
        conicAngle: "0deg",
        p1: { x: 10, y: 15 },
        p2: { x: 90, y: 10 },
        p3: { x: 85, y: 85 },
        p4: { x: 15, y: 90 },
        stops: [
            { color: "#111111", offset: 0 },
            { color: "#333333", offset: 100 }
        ]
    });

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
    const [activeSidebarTab, setActiveSidebarTab] = useState("assets"); // assets, layers, presets, uploads
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
    const [editingTextId, setEditingTextId] = useState(null);
    const [snapToGrid, setSnapToGrid] = useState(true);
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

    // Track states in refs to prevent stale closure data in event listeners
    const elementsRef = useRef(elements);
    const canvasBgRef = useRef(canvasBg);

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    useEffect(() => {
        canvasBgRef.current = canvasBg;
    }, [canvasBg]);

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

    // Undo / Redo engine
    const pushToHistoryState = (newElements, newBg = canvasBg) => {
        setPast(prev => [...prev.slice(-49), { elements: elementsRef.current, canvasBg: canvasBgRef.current }]);
        setFuture([]);
        setElements(newElements);
        if (newBg !== canvasBg) {
            setCanvasBg(newBg);
        }
        saveToLocalStorage(newElements, newBg, borderRadius, title, linkUrl);
    };

    const handleUndo = () => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        setFuture(prev => [{ elements: elementsRef.current, canvasBg: canvasBgRef.current }, ...prev]);
        setPast(prev => prev.slice(0, -1));
        setElements(previous.elements);
        setCanvasBg(previous.canvasBg);
        saveToLocalStorage(previous.elements, previous.canvasBg, borderRadius, title, linkUrl);
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const next = future[0];
        setPast(prev => [...prev, { elements: elementsRef.current, canvasBg: canvasBgRef.current }]);
        setFuture(prev => prev.slice(1));
        setElements(next.elements);
        setCanvasBg(next.canvasBg);
        saveToLocalStorage(next.elements, next.canvasBg, borderRadius, title, linkUrl);
    };

    // Auto-Save draft recovery
    const saveToLocalStorage = (els, bg, br, t, link) => {
        try {
            const data = {
                elements: els,
                canvasBg: bg,
                borderRadius: br,
                title: t,
                linkUrl: link,
                timestamp: Date.now()
            };
            localStorage.setItem("snitch_popup_canvas_draft", JSON.stringify(data));
        } catch (e) {
            console.error("Local storage save failed", e);
        }
    };

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem("snitch_popup_canvas_draft");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.elements) setElements(parsed.elements);
                if (parsed.canvasBg) setCanvasBg(parsed.canvasBg);
                if (parsed.borderRadius) setBorderRadius(parsed.borderRadius);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.linkUrl) setLinkUrl(parsed.linkUrl);
                
                parsed.elements.forEach(el => {
                    if (el.type === "text" && el.fontFamily) {
                        loadGoogleFont(el.fontFamily);
                    }
                });
            }
        } catch (e) {
            console.error("Failed to restore draft", e);
        }
    };

    const hasLocalStorageBackup = () => {
        return !!localStorage.getItem("snitch_popup_canvas_draft");
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
        saveToLocalStorage(elementsRef.current, updatedBg, borderRadius, title, linkUrl);
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
            const p1 = bg.p1 || { x: 0, y: 0 };
            const p2 = bg.p2 || { x: 100, y: 0 };
            const p3 = bg.p3 || { x: 100, y: 100 };
            const p4 = bg.p4 || { x: 0, y: 100 };
            return `radial-gradient(at ${p1.x}% ${p1.y}%, ${bg.color1} 0px, transparent 65%),
                    radial-gradient(at ${p2.x}% ${p2.y}%, ${bg.color2} 0px, transparent 65%),
                    radial-gradient(at ${p3.x}% ${p3.y}%, ${bg.color3} 0px, transparent 65%),
                    radial-gradient(at ${p4.x}% ${p4.y}%, ${bg.color4} 0px, transparent 65%)`;
        }
        return bg.color1;
    };

    // Editor initializers
    const handleCreateNew = () => {
        setEditItem(null);
        setTitle("New Autumn Campaign");
        setLinkUrl("/shop");
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
                shadowColor: "rgba(0,0,0,0.5)"
            },
            {
                id: `text-head-${Date.now()}`,
                type: "text",
                content: "MID SEASON\nCLEARANCE",
                x: 50,
                y: 60,
                width: 280,
                height: 90,
                zIndex: 2,
                isLocked: false,
                fontFamily: "Cabinet Grotesk",
                fontSize: 28,
                fontWeight: "black",
                textAlign: "center",
                color: "#ffffff",
                isGradientText: false,
                textGradient: { start: "#f59e0b", end: "#ef4444", dir: "to-r" },
                opacity: 100,
                rotate: 0,
                shadowX: 0,
                shadowY: 4,
                shadowBlur: 10,
                shadowColor: "rgba(0,0,0,0.4)"
            }
        ]);
        setCanvasBg({
            type: "linear",
            color1: "#0f0c20",
            color2: "#15102a",
            color3: "#4f46e5",
            color4: "#db2777",
            direction: "to-r",
            conicAngle: "0deg",
            p1: { x: 10, y: 15 },
            p2: { x: 90, y: 10 },
            p3: { x: 85, y: 85 },
            p4: { x: 15, y: 90 },
            stops: [
                { color: "#0d0a1b", offset: 0 },
                { color: "#1e1335", offset: 100 }
            ]
        });
        loadGoogleFont("Cabinet Grotesk");
        setSelectedId(null);
        setPast([]);
        setFuture([]);
        setShowEditor(true);
    };

    const handleEditCampaign = (item) => {
        setEditItem(item);
        setTitle(item.title);
        setLinkUrl(item.linkUrl || "");
        setSize(item.size || "md");
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
            p1: { x: 10, y: 15 },
            p2: { x: 90, y: 10 },
            p3: { x: 85, y: 85 },
            p4: { x: 15, y: 90 },
            stops: [
                { color: "#111111", offset: 0 },
                { color: "#333333", offset: 100 }
            ]
        };

        if (item.metadata) {
            try {
                const meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : item.metadata;
                if (meta.elements) loadedEls = meta.elements;
                if (meta.canvasBg) loadedBg = meta.canvasBg;
            } catch (e) {
                console.error("Failed parsing metadata json", e);
            }
        }
        
        setElements(loadedEls);
        setCanvasBg(loadedBg);
        
        loadedEls.forEach(el => {
            if (el.type === "text" && el.fontFamily) {
                loadGoogleFont(el.fontFamily);
            }
        });
        
        setSelectedId(null);
        setPast([]);
        setFuture([]);
        setShowEditor(true);
    };

    // Add elements methods
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
            x: 90,
            y: 200,
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
                    x: 60,
                    y: 120,
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
            x: 60,
            y: 120,
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
            x: 110,
            y: 150,
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
            borderRadius: 0 // for rect shapes
        };
        pushToHistoryState([...elements, newEl]);
        setSelectedId(id);
    };

    // Vector Editor Mouse Drag/Resize/Rotate Interactivity
    const handleElementMouseDown = (e, item, isResize = false) => {
        if (isPenMode) return;
        if (item.isLocked) return;
        if (editingTextId === item.id) return;
        e.stopPropagation();
        
        setSelectedId(item.id);

        dragInfo.current = {
            isDragging: !isResize,
            isResizing: isResize,
            isRotating: false,
            startX: e.clientX,
            startY: e.clientY,
            elementX: item.x,
            elementY: item.y,
            elementW: item.width,
            elementH: item.height,
            elementR: item.rotate || 0
        };

        if (!isResize) {
            document.addEventListener("mousemove", handleGlobalDragMouseMove);
            document.addEventListener("mouseup", handleGlobalDragMouseUp);
        }
    };

    const handleGlobalDragMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isDragging) return;

        const dx = e.clientX - info.startX;
        const dy = e.clientY - info.startY;

        const grid = snapToGrid ? 8 : 1;
        const newX = Math.round((info.elementX + dx) / grid) * grid;
        const newY = Math.round((info.elementY + dy) / grid) * grid;

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return {
                ...el,
                x: Math.max(-100, Math.min(380, newX)),
                y: Math.max(-100, Math.min(500, newY))
            };
        }));
    };

    const handleGlobalDragMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalDragMouseMove);
        document.removeEventListener("mouseup", handleGlobalDragMouseUp);
        pushToHistoryState(elementsRef.current);
    };

    // 8-Direction Resizing Handler
    const handleResizeStart = (e, handle, item) => {
        e.stopPropagation();
        e.preventDefault();

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
            elementH: item.height
        };

        document.addEventListener("mousemove", handleGlobalResizeMouseMove);
        document.addEventListener("mouseup", handleGlobalResizeMouseUp);
    };

    const handleGlobalResizeMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isResizing) return;

        const dx = e.clientX - info.startX;
        const dy = e.clientY - info.startY;

        let newX = info.elementX;
        let newY = info.elementY;
        let newW = info.elementW;
        let newH = info.elementH;

        const grid = snapToGrid ? 8 : 1;
        const snap = (val) => Math.round(val / grid) * grid;

        switch (info.handle) {
            case "e":
                newW = snap(Math.max(10, info.elementW + dx));
                break;
            case "w":
                newW = snap(Math.max(10, info.elementW - dx));
                newX = info.elementX + (info.elementW - newW);
                break;
            case "s":
                newH = snap(Math.max(10, info.elementH + dy));
                break;
            case "n":
                newH = snap(Math.max(10, info.elementH - dy));
                newY = info.elementY + (info.elementH - newH);
                break;
            case "se":
                newW = snap(Math.max(10, info.elementW + dx));
                newH = snap(Math.max(10, info.elementH + dy));
                break;
            case "sw":
                newW = snap(Math.max(10, info.elementW - dx));
                newH = snap(Math.max(10, info.elementH + dy));
                newX = info.elementX + (info.elementW - newW);
                break;
            case "ne":
                newW = snap(Math.max(10, info.elementW + dx));
                newH = snap(Math.max(10, info.elementH - dy));
                newY = info.elementY + (info.elementH - newH);
                break;
            case "nw":
                newW = snap(Math.max(10, info.elementW - dx));
                newH = snap(Math.max(10, info.elementH - dy));
                newX = info.elementX + (info.elementW - newW);
                newY = info.elementY + (info.elementH - newH);
                break;
            default:
                break;
        }

        setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            return {
                ...el,
                x: newX,
                y: newY,
                width: newW,
                height: newH
            };
        }));
    };

    const handleGlobalResizeMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalResizeMouseMove);
        document.removeEventListener("mouseup", handleGlobalResizeMouseUp);
        pushToHistoryState(elementsRef.current);
    };

    // Rotation Handler
    const handleRotateStart = (e, item) => {
        e.stopPropagation();
        e.preventDefault();

        const elDom = document.getElementById(`element-frame-${item.id}`);
        if (!elDom) return;
        const rect = elDom.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        dragInfo.current = {
            isDragging: false,
            isResizing: false,
            isRotating: true,
            centerX,
            centerY,
            elementR: item.rotate || 0
        };

        document.addEventListener("mousemove", handleGlobalRotateMouseMove);
        document.addEventListener("mouseup", handleGlobalRotateMouseUp);
    };

    const handleGlobalRotateMouseMove = (e) => {
        const info = dragInfo.current;
        if (!info.isRotating) return;

        const dx = e.clientX - info.centerX;
        const dy = e.clientY - info.centerY;

        let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
        if (angle < 0) angle += 360;

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
        pushToHistoryState(elementsRef.current);
    };

    // Pen Drawing Tool interaction
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
            fill: "#db2777",
            stroke: "#ffffff",
            strokeWidth: 2,
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
            pointIndex: index
        };

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

        setCanvasBg(prev => {
            const key = `p${info.pointIndex}`;
            const updated = { ...prev, [key]: { x: rx, y: ry } };
            saveToLocalStorage(elementsRef.current, updated, borderRadius, title, linkUrl);
            return updated;
        });
    };

    const handleGlobalMeshMouseUp = () => {
        document.removeEventListener("mousemove", handleGlobalMeshMouseMove);
        document.removeEventListener("mouseup", handleGlobalMeshMouseUp);
        pushToHistoryState(elementsRef.current, canvasBgRef.current);
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
            x: Math.min(380 - el.width, el.x + 15),
            y: Math.min(500 - el.height, el.y + 15),
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
        saveToLocalStorage(elementsRef.current, canvasBg, borderRadius, title, linkUrl);
    };

    // Layer zIndex ordering
    const moveZIndex = (direction) => {
        if (!selectedId) return;
        const index = elements.findIndex(el => el.id === selectedId);
        if (index === -1) return;

        let list = [...elements].sort((a, b) => a.zIndex - b.zIndex);
        const itemIdx = list.findIndex(el => el.id === selectedId);

        if (direction === "front") {
            const maxZ = Math.max(...list.map(el => el.zIndex), 0);
            pushToHistoryState(elements.map(el => el.id === selectedId ? { ...el, zIndex: maxZ + 1 } : el));
        } else if (direction === "back") {
            const minZ = Math.min(...list.map(el => el.zIndex), 0);
            pushToHistoryState(elements.map(el => el.id === selectedId ? { ...el, zIndex: minZ - 1 } : el));
        } else if (direction === "forward" && itemIdx < list.length - 1) {
            const nextItem = list[itemIdx + 1];
            pushToHistoryState(elements.map(el => {
                if (el.id === selectedId) return { ...el, zIndex: nextItem.zIndex };
                if (el.id === nextItem.id) return { ...el, zIndex: list[itemIdx].zIndex };
                return el;
            }));
        } else if (direction === "backward" && itemIdx > 0) {
            const prevItem = list[itemIdx - 1];
            pushToHistoryState(elements.map(el => {
                if (el.id === selectedId) return { ...el, zIndex: prevItem.zIndex };
                if (el.id === prevItem.id) return { ...el, zIndex: list[itemIdx].zIndex };
                return el;
            }));
        }
    };

    // Align controls relative to canvas bounds (380x500)
    const handleAlign = (direction) => {
        if (!selectedId) return;
        const el = elements.find(item => item.id === selectedId);
        if (!el || el.isLocked) return;

        let newX = el.x;
        let newY = el.y;

        if (direction === "left") newX = 0;
        if (direction === "h_center") newX = Math.round((380 - el.width) / 2);
        if (direction === "right") newX = 380 - el.width;
        if (direction === "top") newY = 0;
        if (direction === "v_center") newY = Math.round((500 - el.height) / 2);
        if (direction === "bottom") newY = 500 - el.height;

        pushToHistoryState(elements.map(item => {
            if (item.id === selectedId) {
                return { ...item, x: newX, y: newY };
            }
            return item;
        }));
    };

    // html2canvas Compile & Save Pipeline
    const handleCompileAndSave = async (isPublishing = false) => {
        if (!canvasRef.current) return;
        setSelectedId(null);
        setEditingTextId(null);
        
        await new Promise(r => setTimeout(r, 120));

        try {
            const canvas = await html2canvas(canvasRef.current, {
                useCORS: true,
                backgroundColor: null,
                width: 380,
                height: 500,
                scale: 2
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
            const imageFile = new File([blob], `${title.replace(/ /g, "_")}-${Date.now()}.png`, { type: "image/png" });

            const payloadData = {
                elements: elementsRef.current,
                canvasBg: canvasBgRef.current
            };

            const data = new FormData();
            data.append("title", title);
            data.append("text", "Canvas Compiled Poster");
            data.append("isActive", isPublishing ? "true" : editItem ? String(editItem.isActive) : "false");
            data.append("isDraft", isPublishing ? "false" : "true");
            data.append("image", imageFile);
            data.append("metadata", JSON.stringify(payloadData));

            if (editItem) {
                await handleUpdatePopup(editItem._id, data);
            } else {
                await handleCreatePopup(data);
            }
            
            // Clean local storage draft upon clean compilation saves
            localStorage.removeItem("snitch_popup_canvas_draft");
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

    // Sidebar resize handles
    const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    const handleClasses = {
        nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
        n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
        ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
        e: "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize",
        se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
        s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
        sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
        w: "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"
    };

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
                        <div className="flex gap-2">
                            {hasLocalStorageBackup() && (
                                <button
                                    onClick={() => {
                                        restoreDraft();
                                        setShowEditor(true);
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase hover:bg-white/10 tracking-wider flex items-center gap-1.5 cursor-pointer"
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
                                        <p className="text-xs font-black text-foreground mt-0.5">Auto-closes in 5 seconds</p>
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
                /* Full Figma-Style workspace editor */
                <div className="flex flex-col h-[85vh] bg-[#121214] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 text-white">
                    {/* Editor Top Bar */}
                    <div className="p-4 bg-[#18181c] border-b border-white/5 flex items-center justify-between flex-wrap gap-4 z-50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetForm}
                                className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer text-foreground/60"
                                title="Exit Studio"
                            >
                                <i className="ri-arrow-left-line text-sm" />
                            </button>
                            <input 
                                value={title} 
                                onChange={e => {
                                    setTitle(e.target.value);
                                    saveToLocalStorage(elements, canvasBg, borderRadius, e.target.value, linkUrl);
                                }} 
                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-accent text-sm font-black uppercase outline-none px-1 py-0.5 max-w-[200px]" 
                                placeholder="Poster Title..."
                            />
                            
                            {/* Undo / Redo buttons */}
                            <div className="h-4 w-[1px] bg-white/10 mx-2" />
                            <div className="flex gap-1">
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
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border flex items-center gap-1
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
                        
                        {/* Tabbed Left Sidebar */}
                        <div className="w-80 bg-[#18181c] border-r border-white/5 flex flex-col h-full overflow-hidden">
                            {/* Sidebar Tab headers */}
                            <div className="grid grid-cols-4 border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-center">
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
                                                {/* Sort by zIndex descending to show top layers at the top */}
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
                                                                {/* Lock Toggle */}
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
                                                                
                                                                {/* Visibility / eye toggle */}
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

                                                                {/* Delete */}
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
                                            <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
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
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Insert Web Graphic</h3>
                                        <div className="flex gap-2">
                                            <input 
                                                value={imageLinkInput} 
                                                onChange={e => setImageLinkInput(e.target.value)} 
                                                className={inputCls} 
                                                placeholder="Paste Image URL..." 
                                            />
                                            <button 
                                                onClick={handleAddImageLink}
                                                className="px-3 bg-accent text-accent-content hover:bg-accent/95 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-white/40 leading-normal">Or click the Add Image file uploader in the top toolbar to overlay a graphic from your local file system.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Vector Canvas Container (Center) */}
                        <div 
                            onContextMenu={(e) => handleCanvasContextMenu(e)}
                            className="flex-1 bg-[#0e0e10] flex items-center justify-center p-6 relative overflow-auto select-none"
                            style={{
                                backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                                backgroundSize: "16px 16px"
                            }}
                        >
                            {/* Bounding Canvas limits (380x500 standard poster bounds) */}
                            <div
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className={`relative w-[380px] h-[500px] shadow-2xl transition-all border border-white/5 shrink-0 overflow-hidden select-none
                                    ${isPenMode ? "cursor-crosshair" : "cursor-default"}`}
                                style={{
                                    background: getCanvasBackgroundCSS(),
                                    borderRadius: borderRadius === "none" ? "0px" : borderRadius === "md" ? "12px" : borderRadius === "lg" ? "16px" : borderRadius === "full" ? "40px" : "24px"
                                }}
                            >
                                {/* Vector Render Elements */}
                                {elements.map((el) => {
                                    if (el.hidden) return null;
                                    const isSelected = el.id === selectedId;
                                    
                                    return (
                                        <div
                                            id={`element-frame-${el.id}`}
                                            key={el.id}
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
                                            {/* Outline borders and 8 Resize Handles */}
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
                                                        title="Drag to Rotate Element (Shift to snap)"
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

                                            {/* Content Type: Text */}
                                            {el.type === "text" && (
                                                editingTextId === el.id ? (
                                                    <textarea
                                                        value={el.content}
                                                        autoFocus
                                                        onChange={(e) => updateSelectedElement("content", e.target.value)}
                                                        onBlur={() => {
                                                            setEditingTextId(null);
                                                            pushToHistoryState(elementsRef.current);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                setEditingTextId(null);
                                                                pushToHistoryState(elementsRef.current);
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

                                            {/* Content Type: Image */}
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

                                            {/* Content Type: Shape */}
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
                                })}

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

                            {/* Draggable Mesh Gradient Control Point Pins (Mesh HUD overlays) */}
                            {canvasBg.type === "mesh" && (
                                <div className="absolute w-[380px] h-[500px] pointer-events-none shrink-0 overflow-visible z-[2000]">
                                    {[1, 2, 3, 4].map(idx => {
                                        const pt = canvasBg[`p${idx}`] || { x: idx % 2 === 0 ? 100 : 0, y: idx > 2 ? 100 : 0 };
                                        const colors = [canvasBg.color1, canvasBg.color2, canvasBg.color3, canvasBg.color4];
                                        return (
                                            <div
                                                key={idx}
                                                onMouseDown={(e) => handleMeshPointMouseDown(e, idx)}
                                                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                                                className="w-5.5 h-5.5 rounded-full absolute -translate-x-1/2 -translate-y-1/2 bg-[#1b1b1f] border-2 border-white pointer-events-auto shadow-2xl flex items-center justify-center cursor-move hover:scale-110 transition-transform active:scale-95"
                                                title={`Drag Mesh Corner ${idx}`}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full border border-white/50 shadow" style={{ backgroundColor: colors[idx - 1] }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Element Properties Sidebar (Right) */}
                        <div className="w-80 bg-[#18181c] border-l border-white/5 overflow-y-auto p-5 space-y-6 flex flex-col h-full">
                            {selectedItem ? (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Inspector Properties</h3>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => updateSelectedElement("isLocked", !selectedItem.isLocked)} 
                                                className="p-1 hover:bg-white/5 rounded text-white"
                                                title={selectedItem.isLocked ? "Unlock layer" : "Lock layer"}
                                            >
                                                <i className={selectedItem.isLocked ? "ri-lock-fill text-accent" : "ri-lock-unlock-line"} />
                                            </button>
                                            <button 
                                                onClick={handleDeleteElement} 
                                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                title="Delete Layer"
                                            >
                                                <i className="ri-delete-bin-line" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fast Alignments Relative to Canvas */}
                                    {!selectedItem.isLocked && (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45">Quick Align</label>
                                            <div className="grid grid-cols-6 gap-1 mt-1 bg-white/5 p-1 rounded-xl">
                                                <button onClick={() => handleAlign("left")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Left"><i className="ri-align-left" /></button>
                                                <button onClick={() => handleAlign("h_center")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Horizontal Center"><i className="ri-align-center" /></button>
                                                <button onClick={() => handleAlign("right")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Right"><i className="ri-align-right" /></button>
                                                <button onClick={() => handleAlign("top")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Top"><i className="ri-align-top" /></button>
                                                <button onClick={() => handleAlign("v_center")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Vertical Center"><i className="ri-align-vertically" /></button>
                                                <button onClick={() => handleAlign("bottom")} className="p-1.5 hover:bg-white/10 rounded-lg text-xs cursor-pointer flex items-center justify-center" title="Align Bottom"><i className="ri-align-bottom" /></button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dimension inputs */}
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
                                                <span>Rotation angle</span>
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
                                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Text content</label>
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
                                                    checked={selectedItem.isGradientText} 
                                                    onChange={e => updateSelectedElement("isGradientText", e.target.checked)} 
                                                    className="w-4 h-4 accent-accent cursor-pointer"
                                                />
                                                <label htmlFor="isGradientText" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">Use Gradient Text</label>
                                            </div>

                                            {!selectedItem.isGradientText ? (
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Text Color</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" value={selectedItem.color} onChange={e => updateSelectedElement("color", e.target.value)} className="w-10 h-8 rounded-lg cursor-pointer" />
                                                        <input type="text" value={selectedItem.color} onChange={e => updateSelectedElement("color", e.target.value)} className={inputCls} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3.5 border-l border-white/10 pl-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">Start Color</label>
                                                            <input type="color" value={selectedItem.textGradient.start} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, start: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">End Color</label>
                                                            <input type="color" value={selectedItem.textGradient.end} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, end: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Flow Direction</label>
                                                        <select value={selectedItem.textGradient.dir} onChange={e => updateSelectedElement("textGradient", { ...selectedItem.textGradient, dir: e.target.value })} className={inputCls}>
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
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Blur Radius</span><span>{selectedItem.filter.blur}px</span></label>
                                                <input type="range" min="0" max="15" value={selectedItem.filter.blur} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, blur: parseInt(e.target.value) })} className={sliderCls} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Brightness</span><span>{selectedItem.filter.brightness}%</span></label>
                                                <input type="range" min="20" max="180" value={selectedItem.filter.brightness} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, brightness: parseInt(e.target.value) })} className={sliderCls} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Contrast</span><span>{selectedItem.filter.contrast}%</span></label>
                                                <input type="range" min="20" max="180" value={selectedItem.filter.contrast} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, contrast: parseInt(e.target.value) })} className={sliderCls} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Grayscale</span><span>{selectedItem.filter.grayscale}%</span></label>
                                                <input type="range" min="0" max="100" value={selectedItem.filter.grayscale} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, grayscale: parseInt(e.target.value) })} className={sliderCls} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Sepia</span><span>{selectedItem.filter.sepia}%</span></label>
                                                <input type="range" min="0" max="100" value={selectedItem.filter.sepia} onChange={e => updateSelectedElement("filter", { ...selectedItem.filter, sepia: parseInt(e.target.value) })} className={sliderCls} />
                                            </div>

                                            {/* Image Border Radius */}
                                            <div className="pt-3 border-t border-white/5">
                                                <label className="text-[8px] font-bold text-white/45 flex justify-between mb-1"><span>Border Corners</span><span>{selectedItem.borderRadius || 0}px</span></label>
                                                <input type="range" min="0" max="100" value={selectedItem.borderRadius || 0} onChange={e => updateSelectedElement("borderRadius", parseInt(e.target.value))} className={sliderCls} />
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
                                                    <input type="color" value={selectedItem.fill} onChange={e => updateSelectedElement("fill", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Color</label>
                                                    <input type="color" value={selectedItem.stroke} onChange={e => updateSelectedElement("stroke", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Stroke Width (px)</label>
                                                <input type="number" value={selectedItem.strokeWidth} onChange={e => updateSelectedElement("strokeWidth", parseInt(e.target.value) || 0)} className={inputCls} />
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
                                                {/* Expanded range up to 1000px */}
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="1000" 
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
                                            <input type="color" value={selectedItem.shadowColor || "#000000"} onChange={e => updateSelectedElement("shadowColor", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Page background/redirection settings (default right sidebar) */
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-white/5 pb-2">Poster Configuration</h3>

                                    {/* Canvas Background mode picker */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Background Type</label>
                                            <select 
                                                value={canvasBg.type} 
                                                onChange={e => {
                                                    const updated = { ...canvasBg, type: e.target.value };
                                                    setCanvasBg(updated);
                                                    pushToHistoryState(elements, updated);
                                                }} 
                                                className={inputCls}
                                            >
                                                <option value="solid">Solid Background</option>
                                                <option value="linear">Linear Gradient</option>
                                                <option value="radial">Radial Gradient</option>
                                                <option value="conic">Conical Gradient</option>
                                                <option value="mesh">Mesh Gradient (4-Point)</option>
                                            </select>
                                        </div>

                                        {/* Background stops and colors */}
                                        <div className="space-y-3.5 pt-1">
                                            {canvasBg.type === "solid" ? (
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Solid Color</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" value={canvasBg.color1} onChange={e => {
                                                            const updated = { ...canvasBg, color1: e.target.value };
                                                            setCanvasBg(updated);
                                                            saveToLocalStorage(elements, updated, borderRadius, title, linkUrl);
                                                        }} className="w-10 h-8 rounded-lg cursor-pointer" />
                                                        <input type="text" value={canvasBg.color1} onChange={e => {
                                                            const updated = { ...canvasBg, color1: e.target.value };
                                                            setCanvasBg(updated);
                                                            saveToLocalStorage(elements, updated, borderRadius, title, linkUrl);
                                                        }} className={inputCls} />
                                                    </div>
                                                </div>
                                            ) : canvasBg.type === "mesh" ? (
                                                <div className="space-y-3 border-l border-white/10 pl-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">Color 1 (TL)</label>
                                                            <input type="color" value={canvasBg.color1} onChange={e => setCanvasBg({ ...canvasBg, color1: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">Color 2 (TR)</label>
                                                            <input type="color" value={canvasBg.color2} onChange={e => setCanvasBg({ ...canvasBg, color2: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">Color 3 (BR)</label>
                                                            <input type="color" value={canvasBg.color3} onChange={e => setCanvasBg({ ...canvasBg, color3: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-white/40 block mb-1">Color 4 (BL)</label>
                                                            <input type="color" value={canvasBg.color4} onChange={e => setCanvasBg({ ...canvasBg, color4: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[8px] text-white/30 leading-normal font-bold uppercase tracking-wider">* Click and drag the handles directly on the canvas to customize corner focus points.</p>
                                                </div>
                                            ) : (
                                                /* Linear / Radial / Conical gradient options + stops */
                                                <div className="space-y-3.5">
                                                    {canvasBg.type === "linear" && (
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Flow Direction</label>
                                                            <select value={canvasBg.direction} onChange={e => {
                                                                const updated = { ...canvasBg, direction: e.target.value };
                                                                setCanvasBg(updated);
                                                                pushToHistoryState(elements, updated);
                                                            }} className={inputCls}>
                                                                <option value="to-r">Left to Right</option>
                                                                <option value="to-b">Top to Bottom</option>
                                                                <option value="to-tr">Top Right Diagonal</option>
                                                            </select>
                                                        </div>
                                                    )}

                                                    {canvasBg.type === "conic" && (
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Conic Angle</label>
                                                            <input type="text" value={canvasBg.conicAngle} onChange={e => {
                                                                const updated = { ...canvasBg, conicAngle: e.target.value };
                                                                setCanvasBg(updated);
                                                                saveToLocalStorage(elements, updated, borderRadius, title, linkUrl);
                                                            }} className={inputCls} placeholder="e.g. 45deg" />
                                                        </div>
                                                    )}

                                                    {/* Color stop sub-slider render */}
                                                    {canvasBg.type !== "solid" && canvasBg.type !== "mesh" && (
                                                        <div className="space-y-3 pt-2">
                                                            <label className="text-[9px] font-black uppercase text-white/45">Gradient Color Stops</label>
                                                            
                                                            <div 
                                                                onClick={(e) => {
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
                                                                                pushToHistoryState(elementsRef.current, canvasBgRef.current);
                                                                            };
                                                                            
                                                                            document.addEventListener("mousemove", handleStopMove);
                                                                            document.addEventListener("mouseup", handleStopUp);
                                                                        }}
                                                                        className="w-3.5 h-6 bg-white border-2 border-accent rounded-md absolute -translate-x-1/2 cursor-ew-resize flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                                                                        style={{ left: `${stop.offset}%` }}
                                                                        title="Drag to slide. Double-click to delete stop."
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
                                                                        <span className="font-bold text-white/45 w-12">Stop {idx + 1} ({stop.offset}%)</span>
                                                                        <input 
                                                                            type="color" 
                                                                            value={stop.color} 
                                                                            onChange={(e) => updateGradientStop(idx, "color", e.target.value)} 
                                                                            className="w-7 h-5 rounded cursor-pointer border border-white/5" 
                                                                        />
                                                                        <input 
                                                                            type="text" 
                                                                            value={stop.color} 
                                                                            onChange={(e) => updateGradientStop(idx, "color", e.target.value)} 
                                                                            className="flex-1 bg-background/50 border border-white/10 rounded px-1.5 py-0.5 outline-none font-mono text-[9px]" 
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
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Border Radius Customizer */}
                                    <div className="pt-3 border-t border-white/5">
                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1.5">Canvas Border Corners</label>
                                        <select 
                                            value={borderRadius} 
                                            onChange={e => {
                                                setBorderRadius(e.target.value);
                                                saveToLocalStorage(elements, canvasBg, e.target.value, title, linkUrl);
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
                                        <label className="text-[9px] font-black uppercase text-white/45 block mb-1">Canvas Action Redirect Link</label>
                                        <input 
                                            value={linkUrl} 
                                            onChange={e => {
                                                setLinkUrl(e.target.value);
                                                saveToLocalStorage(elements, canvasBg, borderRadius, title, e.target.value);
                                            }} 
                                            className={inputCls} 
                                            placeholder="e.g. /shop or /products/ID" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Figma-Style Context Menu Overlay */}
            {contextMenu.visible && (
                <div 
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }} 
                    className="fixed bg-[#1f1f23]/95 border border-[#2a2a30]/80 rounded-2xl shadow-2xl p-2.5 z-[99999] min-w-[160px] backdrop-blur-md text-xs space-y-1 animate-in zoom-in-95 duration-100 text-white"
                >
                    {contextMenu.targetId ? (
                        <>
                            <button onClick={() => { setSelectedId(contextMenu.targetId); moveZIndex("front"); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Bring to Front</span>
                                <span className="text-[10px] text-white/35">]</span>
                            </button>
                            <button onClick={() => { setSelectedId(contextMenu.targetId); moveZIndex("back"); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Send to Back</span>
                                <span className="text-[10px] text-white/35">[</span>
                            </button>
                            <button onClick={() => { setSelectedId(contextMenu.targetId); moveZIndex("forward"); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Move Forward</span>
                                <span className="text-[10px] text-white/35">Ctrl+]</span>
                            </button>
                            <button onClick={() => { setSelectedId(contextMenu.targetId); moveZIndex("backward"); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Move Backward</span>
                                <span className="text-[10px] text-white/35">Ctrl+[</span>
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button onClick={() => {
                                const el = elements.find(item => item.id === contextMenu.targetId);
                                if (el) {
                                    updateSelectedElementState(contextMenu.targetId, "isLocked", !el.isLocked);
                                }
                            }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>{elements.find(item => item.id === contextMenu.targetId)?.isLocked ? "Unlock Layer" : "Lock Layer"}</span>
                                <i className="ri-lock-line text-[10px]" />
                            </button>
                            <button onClick={() => handleDuplicateElement(contextMenu.targetId)} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Duplicate</span>
                                <span className="text-[10px] text-white/35">Ctrl+D</span>
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button onClick={() => { handleDeleteElementById(contextMenu.targetId); }} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Delete</span>
                                <i className="ri-delete-bin-line text-[10px]" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={addTextElement} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Add Text</span>
                                <i className="ri-text text-[10px]" />
                            </button>
                            <button onClick={() => handleAddShape("rect")} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Add Rectangle</span>
                                <i className="ri-checkbox-blank-line text-[10px]" />
                            </button>
                            <button onClick={() => handleAddShape("circle")} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Add Circle</span>
                                <i className="ri-checkbox-blank-circle-line text-[10px]" />
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button onClick={() => pushToHistoryState([])} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center justify-between cursor-pointer">
                                <span>Clear All Layers</span>
                                <i className="ri-refresh-line text-[10px]" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // Context Menu layer helpers
    function updateSelectedElementState(id, key, value) {
        const updated = elementsRef.current.map(item => {
            if (item.id === id) return { ...item, [key]: value };
            return item;
        });
        setElements(updated);
        saveToLocalStorage(updated, canvasBgRef.current, borderRadius, title, linkUrl);
    }

    function handleTextDoubleClick(e, el) {
        e.stopPropagation();
        if (el.isLocked) return;
        setEditingTextId(el.id);
        setSelectedId(el.id);
    }
};

export default AdminPopupsPage;
