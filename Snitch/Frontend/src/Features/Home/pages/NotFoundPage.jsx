import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

const NotFoundPage = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Game states: 'START' | 'PLAYING' | 'GAMEOVER'
    const [gameState, setGameState] = useState("START");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("snitch_catcher_highscore") || "0"));
    const [lives, setLives] = useState(3);

    // References for the game loop to avoid React stale closures
    const gameStateRef = useRef(gameState);
    const scoreRef = useRef(score);
    const livesRef = useRef(lives);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        livesRef.current = lives;
    }, [lives]);

    // Game variables
    const playerRef = useRef({ x: 250, y: 340, width: 80, height: 20, speed: 15 });
    const keysPressed = useRef({});
    const itemsRef = useRef([]);
    const particlesRef = useRef([]);
    const frameIdRef = useRef(null);
    const spawnTimerRef = useRef(0);
    const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });

    const handleStartGame = () => {
        setScore(0);
        setLives(3);
        itemsRef.current = [];
        particlesRef.current = [];
        playerRef.current.x = 260;
        setGameState("PLAYING");
    };

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            keysPressed.current[e.key] = true;
            if (e.key === " " && gameStateRef.current !== "PLAYING") {
                handleStartGame();
            }
        };
        const handleKeyUp = (e) => {
            keysPressed.current[e.key] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Mouse control handler (smooth responsive dragging)
    const handleMouseMove = (e) => {
        if (gameStateRef.current !== "PLAYING" || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const root = document.documentElement;
        
        // Calculate mouse X relative to canvas
        const mouseX = e.clientX - rect.left - root.scrollLeft;
        
        // Set player center to mouse X
        let targetX = mouseX - playerRef.current.width / 2;
        
        // Bound checks
        if (targetX < 0) targetX = 0;
        if (targetX > 600 - playerRef.current.width) targetX = 600 - playerRef.current.width;
        
        playerRef.current.x = targetX;
    };

    // Game loop logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const updateGame = () => {
            if (gameStateRef.current !== "PLAYING") return;

            // Handle Screen Shake reduction
            if (screenShakeRef.current.intensity > 0) {
                screenShakeRef.current.intensity *= 0.9;
                screenShakeRef.current.x = (Math.random() - 0.5) * screenShakeRef.current.intensity;
                screenShakeRef.current.y = (Math.random() - 0.5) * screenShakeRef.current.intensity;
                if (screenShakeRef.current.intensity < 0.2) {
                    screenShakeRef.current.intensity = 0;
                    screenShakeRef.current.x = 0;
                    screenShakeRef.current.y = 0;
                }
            }

            // Keyboard movement fallback
            if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) {
                playerRef.current.x -= playerRef.current.speed;
                if (playerRef.current.x < 0) playerRef.current.x = 0;
            }
            if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) {
                playerRef.current.x += playerRef.current.speed;
                if (playerRef.current.x > 600 - playerRef.current.width) {
                    playerRef.current.x = 600 - playerRef.current.width;
                }
            }

            // Spawn items
            spawnTimerRef.current++;
            // Speed up spawn rate as score grows
            const spawnInterval = Math.max(25, 60 - Math.floor(scoreRef.current / 4));
            if (spawnTimerRef.current >= spawnInterval) {
                spawnTimerRef.current = 0;
                
                // 65% clothes, 20% bombs, 15% 404 blocks
                const rand = Math.random();
                let type = "garment";
                let color = "#ffffff";
                let label = "👕";
                
                if (rand > 0.8) {
                    type = "bomb";
                    label = "💣";
                } else if (rand > 0.65) {
                    type = "error404";
                    label = "404";
                    color = "#ef4444";
                } else {
                    const garments = [
                        { label: "👕", color: "#10b981" }, // Green shirt
                        { label: "👖", color: "#3b82f6" }, // Blue jeans
                        { label: "👟", color: "#a855f7" }, // Purple sneaker
                        { label: "🧥", color: "#f59e0b" }, // Amber coat
                        { label: "🕶️", color: "#f43f5e" }  // Rose glasses
                    ];
                    const selected = garments[Math.floor(Math.random() * garments.length)];
                    label = selected.label;
                    color = selected.color;
                }

                itemsRef.current.push({
                    x: Math.random() * 540 + 20,
                    y: -20,
                    type,
                    label,
                    color,
                    speed: Math.random() * 2 + 3 + Math.min(scoreRef.current / 12, 5), // Accelerates as score increases
                    radius: 18,
                });
            }

            // Update items positions & check collisions
            itemsRef.current.forEach((item, index) => {
                item.y += item.speed;

                // Check collision with player basket
                const player = playerRef.current;
                const hitX = item.x >= player.x && item.x <= player.x + player.width;
                const hitY = item.y + item.radius >= player.y && item.y - item.radius <= player.y + player.height;

                if (hitX && hitY) {
                    // Remove item
                    itemsRef.current.splice(index, 1);

                    if (item.type === "garment") {
                        // Catch garment: score points
                        setScore((s) => s + 10);
                        // Trigger catch particles
                        for (let i = 0; i < 8; i++) {
                            particlesRef.current.push({
                                x: item.x,
                                y: item.y,
                                vx: (Math.random() - 0.5) * 5,
                                vy: (Math.random() - 0.5) * 5 - 2,
                                color: item.color,
                                size: Math.random() * 3 + 2,
                                alpha: 1,
                                life: 30
                            });
                        }
                    } else {
                        // Collided with bomb or 404 block: deduct life
                        setLives((l) => {
                            const next = l - 1;
                            if (next <= 0) {
                                setGameState("GAMEOVER");
                            }
                            return next;
                        });

                        // Trigger screen shake
                        screenShakeRef.current.intensity = 15;

                        // Trigger explosion particles
                        for (let i = 0; i < 15; i++) {
                            particlesRef.current.push({
                                x: item.x,
                                y: item.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                color: "#ef4444",
                                size: Math.random() * 5 + 3,
                                alpha: 1,
                                life: 40
                            });
                        }
                    }
                }

                // If missed and fell below canvas
                if (item.y > 400 + item.radius) {
                    itemsRef.current.splice(index, 1);
                }
            });

            // Update particles
            particlesRef.current.forEach((p, idx) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha = Math.max(0, p.alpha - 1 / p.life);
                if (p.alpha <= 0) {
                    particlesRef.current.splice(idx, 1);
                }
            });
        };

        const renderGame = () => {
            ctx.clearRect(0, 0, 600, 400);

            // Draw game background grids (retro cyber style)
            ctx.save();
            ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 600; i += 30) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 400);
                ctx.stroke();
            }
            for (let i = 0; i < 400; i += 30) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(600, i);
                ctx.stroke();
            }

            // Draw player basket (neon glowing drawer)
            const p = playerRef.current;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#f43f5e"; // Accent pink color
            ctx.fillStyle = "#f43f5e";
            
            // Draw a stylish basket
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, p.height, 6);
            ctx.fill();
            
            // Draw handles
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(p.x + 10, p.y);
            ctx.quadraticCurveTo(p.x + p.width/2, p.y - 12, p.x + p.width - 10, p.y);
            ctx.stroke();

            // Draw falling items
            ctx.shadowBlur = 0;
            itemsRef.current.forEach((item) => {
                if (item.type === "garment" || item.type === "bomb") {
                    ctx.font = "24px sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(item.label, item.x, item.y);
                } else if (item.type === "error404") {
                    // Draw red glowing 404 tag
                    ctx.save();
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#ef4444";
                    ctx.fillStyle = "#ef4444";
                    ctx.font = "black 14px monospace";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    
                    ctx.beginPath();
                    ctx.roundRect(item.x - 22, item.y - 10, 44, 20, 4);
                    ctx.fill();
                    
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText("404", item.x, item.y);
                    ctx.restore();
                }
            });

            // Draw particles
            particlesRef.current.forEach((pt) => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            ctx.restore();
        };

        const tick = () => {
            updateGame();
            renderGame();
            frameIdRef.current = requestAnimationFrame(tick);
        };

        tick();

        return () => {
            cancelAnimationFrame(frameIdRef.current);
        };
    }, []);

    // Save Highscore when Game Over
    useEffect(() => {
        if (gameState === "GAMEOVER") {
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem("snitch_catcher_highscore", score.toString());
            }
        }
    }, [gameState, score, highScore]);

    return (
        <div className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-background px-6 py-10" ref={containerRef}>
            {/* Ambient Background Blur */}
            <div className="absolute w-80 h-80 rounded-full bg-accent/5 blur-[90px] top-[10%] left-[15%] pointer-events-none" />
            <div className="absolute w-96 h-96 rounded-full bg-indigo-500/5 blur-[110px] bottom-[10%] right-[15%] pointer-events-none" />

            {/* Retro Game Container Card */}
            <div className="relative z-10 max-w-2xl w-full p-6 md:p-8 rounded-[36px] bg-surface/30 border border-border-theme/40 backdrop-blur-xl shadow-2xl flex flex-col items-center">
                
                {/* Score & Lives HUD (Heads-Up-Display) */}
                <div className="flex justify-between w-full items-center mb-4 px-2 select-none">
                    <div className="flex gap-4">
                        <div className="text-left">
                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/45 block">Score</span>
                            <span className="text-lg font-black text-accent font-mono">{score}</span>
                        </div>
                        <div className="text-left">
                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/45 block">High Score</span>
                            <span className="text-lg font-black text-foreground/60 font-mono">{highScore}</span>
                        </div>
                    </div>

                    {/* Hearts representing remaining lives */}
                    <div className="flex gap-1">
                        {[1, 2, 3].map((heart) => (
                            <i 
                                key={heart}
                                className={`text-lg transition-all duration-300 ${
                                    heart <= lives 
                                        ? "ri-heart-3-fill text-rose-500 scale-100" 
                                        : "ri-heart-3-line text-foreground/20 scale-90"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Canvas Arcade screen */}
                <div className="relative border border-border-theme/60 bg-black/60 rounded-2xl w-full h-[400px] overflow-hidden cursor-crosshair group shadow-inner">
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        onMouseMove={handleMouseMove}
                        className="w-full h-full object-contain"
                    />

                    {/* Overlay Start Screen */}
                    <AnimatePresence>
                        {gameState === "START" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
                            >
                                <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono bg-accent/15 px-3 py-1 rounded-full mb-3">
                                    Error Code 404
                                </span>
                                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Garment Catcher</h2>
                                <p className="text-foreground/45 text-xs font-semibold max-w-sm mt-3 leading-relaxed">
                                    Move the basket with your **mouse cursor** or **left/right arrow keys** to catch falling clothes. Avoid bombs and red 404 blocks!
                                </p>
                                <button
                                    onClick={handleStartGame}
                                    className="mt-6 px-8 py-3 bg-accent text-accent-content font-black text-xs tracking-widest uppercase rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95 cursor-pointer"
                                >
                                    Insert Coin & Start
                                </button>
                                <span className="text-[8px] text-foreground/30 font-bold uppercase mt-3 tracking-widest">or press Spacebar</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Overlay Game Over Screen */}
                    <AnimatePresence>
                        {gameState === "GAMEOVER" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
                            >
                                <span className="text-[10px] font-black tracking-widest text-red-500 uppercase font-mono bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full mb-3">
                                    Connection Lost
                                </span>
                                <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter">Game Over</h2>
                                <p className="text-foreground/50 text-sm font-bold mt-4">
                                    Your Score: <span className="text-accent text-lg font-black">{score}</span>
                                </p>
                                {score >= highScore && score > 0 && (
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">👑 New Personal Best! 👑</span>
                                )}
                                
                                <div className="flex gap-3 mt-8 w-full max-w-xs">
                                    <button
                                        onClick={handleStartGame}
                                        className="flex-1 py-3 bg-accent text-accent-content font-black text-[10px] tracking-widest uppercase rounded-xl hover:scale-102 transition-all cursor-pointer shadow-md active:scale-95"
                                    >
                                        Replay Game
                                    </button>
                                    <button
                                        onClick={() => navigate("/")}
                                        className="flex-1 py-3 bg-surface border border-border-theme text-foreground font-black text-[10px] tracking-widest uppercase rounded-xl hover:bg-white/5 transition-all cursor-pointer active:scale-95"
                                    >
                                        Go Catalog
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer redirection button */}
                {gameState === "PLAYING" && (
                    <div className="w-full flex justify-center mt-6">
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-2.5 bg-surface border border-border-theme text-foreground/60 hover:text-foreground rounded-2xl text-[9px] font-black tracking-widest uppercase active:scale-95 transition-all cursor-pointer"
                        >
                            Give up & Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotFoundPage;
