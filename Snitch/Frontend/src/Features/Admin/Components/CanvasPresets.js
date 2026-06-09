// 🎨 Design Workspace Presets & Configuration Templates

export const PRESET_SHAPES = {
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
    star_4: { name: "4-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L60,40 L100,50 L60,60 L50,100 L40,60 L0,50 L40,40 Z" },
    star_5: { name: "5-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L63,38 L100,38 L70,61 L82,100 L50,75 L18,100 L30,61 L0,38 L37,38 Z" },
    star_6: { name: "6-Pt Star", type: "shape", shapeType: "polygon", points: "50,0 65,30 100,30 80,55 90,90 50,70 10,90 20,55 0,30 35,30" },
    star_8: { name: "8-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L62,35 L95,35 L70,55 L80,88 L50,70 L20,88 L30,55 L5,35 L38,35 Z" },
    heart: { name: "Heart", type: "shape", shapeType: "path", path: "M50,18 C35,0 0,0 0,35 C0,65 50,95 50,95 C50,95 100,65 100,35 C100,0 65,0 50,18 Z" },
    speech: { name: "Speech Bubble", type: "shape", shapeType: "path", path: "M10,0 L90,0 C95,0 100,5 100,10 L100,60 C100,65 95,70 90,70 L45,70 L25,90 L25,70 L10,70 C5,70 0,65 0,60 L0,10 C0,5 5,0 10,0 Z" },
    shield: { name: "Shield", type: "shape", shapeType: "path", path: "M0,15 L50,0 L100,15 L100,60 C100,85 50,100 50,100 C50,100 0,85 0,60 Z" },
    crescent: { name: "Crescent Moon", type: "shape", shapeType: "path", path: "M50,0 C20,0 0,25 0,55 C0,85 25,100 50,100 C30,90 20,70 20,50 C20,30 30,10 50,0 Z" },
    badge: { name: "Burst Badge", type: "shape", shapeType: "polygon", points: "50,0 60,10 70,0 80,10 90,0 100,10 90,20 100,30 90,40 100,50 90,60 100,70 90,80 100,90 90,100 80,90 70,100 60,90 50,100 40,90 30,100 20,90 10,100 0,90 10,80 0,70 10,60 0,50 10,40 0,30 10,20 0,10 10,0 20,10 30,0 40,10" },
    tag: { name: "Price Tag", type: "shape", shapeType: "polygon", points: "0,20 0,80 60,80 100,50 60,20" },
    decagon: { name: "Decagon", type: "shape", shapeType: "polygon", points: "50,0 79,9 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,9" },
    cloud: { name: "Cloud Bubble", type: "shape", shapeType: "path", path: "M25,60 C15,60 10,50 10,40 C10,30 20,20 35,20 C40,10 55,5 70,10 C85,15 90,30 90,40 C95,40 100,45 100,50 C100,55 95,60 90,60 Z" },
    flower: { name: "Retro Flower", type: "shape", shapeType: "path", path: "M50,35 C55,20 70,20 75,30 C90,30 90,45 80,50 C90,55 90,70 75,70 C70,80 55,80 50,65 C45,80 30,80 25,70 C10,70 10,55 20,50 C10,45 10,30 25,30 C30,20 45,20 50,35 Z" },
    message: { name: "Envelope Poly", type: "shape", shapeType: "polygon", points: "50,0 100,35 100,100 0,100 0,35" },
    ribbon: { name: "Banner Ribbon", type: "shape", shapeType: "path", path: "M0,20 L25,0 L75,0 L100,20 L100,80 L75,100 L25,100 L0,80 Z" },
    blob: { name: "Organic Blob", type: "shape", shapeType: "path", path: "M25,30 C35,10 65,15 75,35 C85,55 95,75 70,85 C45,95 15,85 10,65 C5,45 15,50 25,30 Z" }
};

export const PRESET_GRADIENTS = [
    {
        name: "Cyberpunk Neon",
        type: "mesh",
        color1: "#ff007f",
        color2: "#7f00ff",
        color3: "#00f0ff",
        color4: "#121214",
        meshPoints: [
            { id: "m-1", x: 15, y: 15, color: "#ff007f", radius: 75 },
            { id: "m-2", x: 85, y: 20, color: "#7f00ff", radius: 75 },
            { id: "m-3", x: 80, y: 80, color: "#00f0ff", radius: 75 },
            { id: "m-4", x: 20, y: 85, color: "#121214", radius: 75 }
        ]
    },
    {
        name: "Neon Midnight",
        type: "mesh",
        color1: "#0a0a16",
        color2: "#4f46e5",
        color3: "#b91c1c",
        color4: "#065f46",
        meshPoints: [
            { id: "m-1", x: 10, y: 15, color: "#0a0a16", radius: 65 },
            { id: "m-2", x: 90, y: 10, color: "#4f46e5", radius: 65 },
            { id: "m-3", x: 85, y: 85, color: "#b91c1c", radius: 65 },
            { id: "m-4", x: 15, y: 90, color: "#065f46", radius: 65 }
        ]
    },
    {
        name: "Aurora Borealis",
        type: "mesh",
        color1: "#050b14",
        color2: "#0d9488",
        color3: "#22c55e",
        color4: "#3b82f6",
        meshPoints: [
            { id: "m-1", x: 5, y: 5, color: "#050b14", radius: 80 },
            { id: "m-2", x: 95, y: 15, color: "#0d9488", radius: 80 },
            { id: "m-3", x: 90, y: 85, color: "#22c55e", radius: 80 },
            { id: "m-4", x: 10, y: 90, color: "#3b82f6", radius: 80 }
        ]
    },
    {
        name: "Sunset Fire",
        type: "mesh",
        color1: "#ef4444",
        color2: "#f97316",
        color3: "#facc15",
        color4: "#ec4899",
        meshPoints: [
            { id: "m-1", x: 15, y: 20, color: "#ef4444", radius: 85 },
            { id: "m-2", x: 80, y: 15, color: "#f97316", radius: 85 },
            { id: "m-3", x: 85, y: 80, color: "#facc15", radius: 85 },
            { id: "m-4", x: 20, y: 85, color: "#ec4899", radius: 85 }
        ]
    },
    {
        name: "Midnight Velvet",
        type: "mesh",
        color1: "#020617",
        color2: "#1e1b4b",
        color3: "#311042",
        color4: "#0f172a",
        meshPoints: [
            { id: "m-1", x: 10, y: 10, color: "#020617", radius: 90 },
            { id: "m-2", x: 90, y: 20, color: "#1e1b4b", radius: 95 },
            { id: "m-3", x: 75, y: 85, color: "#311042", radius: 90 },
            { id: "m-4", x: 15, y: 75, color: "#0f172a", radius: 95 }
        ]
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
        name: "Warm Sunset",
        type: "linear",
        direction: "to-tr",
        stops: [
            { color: "#ea580c", offset: 0 },
            { color: "#e11d48", offset: 60 },
            { color: "#facc15", offset: 100 }
        ]
    },
    {
        name: "Bubblegum",
        type: "radial",
        stops: [
            { color: "#ff80bf", offset: 0 },
            { color: "#93c5fd", offset: 70 },
            { color: "#c084fc", offset: 100 }
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
        name: "Ocean Breeze",
        type: "linear",
        direction: "to-b",
        stops: [
            { color: "#0ea5e9", offset: 0 },
            { color: "#22d3ee", offset: 50 },
            { color: "#047857", offset: 100 }
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

export const TEXT_PRESETS = [
    { name: "Big Headline", fontSize: 36, fontWeight: "black", fontFamily: "Cabinet Grotesk", color: "#ffffff" },
    { name: "Neon Glow", fontSize: 26, fontWeight: "bold", fontFamily: "Syne", color: "#ff007f", shadowX: 0, shadowY: 0, shadowBlur: 15, shadowColor: "#ff007f" },
    { name: "Gold Metallic", fontSize: 28, fontWeight: "black", fontFamily: "Cabinet Grotesk", color: "#bf953f", isGradientText: true, textGradient: { start: "#bf953f", end: "#fcf6ba", dir: "to-r" }, shadowX: 2, shadowY: 2, shadowBlur: 4, shadowColor: "rgba(0,0,0,0.6)" },
    { name: "Cyber Glitch", fontSize: 30, fontWeight: "black", fontFamily: "Syne", color: "#00ffff", isGradientText: true, textGradient: { start: "#00ffff", end: "#ff00ff", dir: "to-r" }, shadowX: 3, shadowY: -3, shadowBlur: 10, shadowColor: "#ff0000" },
    { name: "3D Blocky", fontSize: 24, fontWeight: "black", fontFamily: "Righteous", color: "#ffffff", shadowX: 6, shadowY: 6, shadowBlur: 0, shadowColor: "#111111" },
    { name: "Soft Glow", fontSize: 22, fontWeight: "bold", fontFamily: "Outfit", color: "#38bdf8", shadowX: 0, shadowY: 0, shadowBlur: 20, shadowColor: "#0ea5e9" },
    { name: "Romantic Rose", fontSize: 24, fontWeight: "normal", fontFamily: "Playfair Display", color: "#fda4af", isGradientText: true, textGradient: { start: "#fda4af", end: "#f43f5e", dir: "to-b" } },
    { name: "Poster Subhead", fontSize: 20, fontWeight: "bold", fontFamily: "Outfit", color: "#60a5fa" },
    { name: "Retro Shadow", fontSize: 22, fontWeight: "black", fontFamily: "Righteous", color: "#fbbf24", shadowX: 4, shadowY: 4, shadowBlur: 0, shadowColor: "#b45309" },
    { name: "Elegant Editorial", fontSize: 24, fontWeight: "normal", fontFamily: "Playfair Display", color: "#f5f5f7" },
    { name: "Caption Details", fontSize: 11, fontWeight: "normal", fontFamily: "Inter", color: "#a1a1aa" }
];

export const CANVAS_SIZES = [
    { name: "Square (1:1 Ratio) - 400x400", width: 400, height: 400, ratio: "1:1" },
    { name: "Standard Portrait (3.8:5 Ratio) - 380x500", width: 380, height: 500, ratio: "3.8:5" },
    { name: "Landscape Banner (16:9 Ratio) - 500x280", width: 500, height: 280, ratio: "16:9" },
    { name: "Mobile Story (9:16 Ratio) - 320x568", width: 320, height: 568, ratio: "9:16" },
    { name: "Standard HD (16:9 Ratio) - 640x360", width: 640, height: 360, ratio: "16:9" },
    { name: "Standard Vertical (9:16 Ratio) - 360x640", width: 360, height: 640, ratio: "9:16" }
];
