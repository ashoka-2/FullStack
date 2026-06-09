import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "../Admin/Hooks/usePopup";
import socket from "../../utils/socket";

const PopupManager = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { activePopups } = useSelector((state) => state.popup);
    const { fetchActivePopups } = usePopup();

    // States
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showPromoPopup, setShowPromoPopup] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [deviceType, setDeviceType] = useState("desktop");

    // Detect screen size type
    useEffect(() => {
        const updateDeviceType = () => {
            const width = window.innerWidth;
            if (width >= 1440) {
                setDeviceType("tv");
            } else if (width >= 1024) {
                setDeviceType("desktop");
            } else if (width >= 640) {
                setDeviceType("tablet");
            } else {
                setDeviceType("mobile");
            }
        };
        updateDeviceType();
        window.addEventListener("resize", updateDeviceType);
        return () => window.removeEventListener("resize", updateDeviceType);
    }, []);

    // ── 1. guest Login Prompt Timer ──────────────────────────────
    useEffect(() => {
        if (user) {
            setShowLoginPrompt(false);
            return;
        }

        const promptShown = localStorage.getItem("snitch_login_prompt_shown");
        if (promptShown === "true") return;

        // Set 30 seconds timeout
        const timer = setTimeout(() => {
            setShowLoginPrompt(true);
        }, 30000);

        return () => clearTimeout(timer);
    }, [user]);

    const handleDismissLoginPrompt = () => {
        setShowLoginPrompt(false);
        localStorage.setItem("snitch_login_prompt_shown", "true");
    };

    const handleLoginRedirect = () => {
        handleDismissLoginPrompt();
        navigate("/login");
    };

    // ── 2. Real-Time Promotional Popups ──────────────────────────
    useEffect(() => {
        // Fetch active popups initially
        fetchActivePopups();

        // Listen for real-time changes
        const handlePopupUpdate = (payload) => {
            if (payload.type === "popup_update") {
                console.log("Real-time popup update received. Fetching new popups...");
                fetchActivePopups();
            }
        };

        socket.on("realtime_update", handlePopupUpdate);
        return () => {
            socket.off("realtime_update", handlePopupUpdate);
        };
    }, []);

    // Toggle promotions visibility when activePopups updates
    useEffect(() => {
        if (activePopups && activePopups.length > 0) {
            setShowPromoPopup(true);
            setCurrentSlideIndex(0);
        } else {
            setShowPromoPopup(false);
        }
    }, [activePopups]);

    // ⚡ Auto-dismiss promotional popup after dynamic displayTime seconds (resets on slide transition)
    useEffect(() => {
        if (showPromoPopup && activePopups && activePopups.length > 0) {
            const currentPopup = activePopups[currentSlideIndex];
            const duration = (currentPopup?.displayTime || 5) * 1000;
            const timer = setTimeout(() => {
                setShowPromoPopup(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [showPromoPopup, currentSlideIndex, activePopups]);

    const handleDismissPromo = () => {
        setShowPromoPopup(false);
    };

    const handleNextSlide = () => {
        setCurrentSlideIndex((prev) => (prev + 1) % activePopups.length);
    };

    const handlePrevSlide = () => {
        setCurrentSlideIndex((prev) => (prev - 1 + activePopups.length) % activePopups.length);
    };

    // Helper functions for layouts
    const getModalSizeClass = (size) => {
        switch (size) {
            case "sm": return "max-w-sm w-full";
            case "lg": return "max-w-lg w-full";
            case "xl": return "max-w-xl w-full";
            case "full": return "max-w-[90vw] w-full";
            case "md":
            default:
                return "max-w-md w-full";
        }
    };

    const getBorderRadiusClass = (radius) => {
        switch (radius) {
            case "none": return "rounded-none";
            case "md": return "rounded-xl";
            case "lg": return "rounded-2xl";
            case "full": return "rounded-[32px]";
            case "2xl":
            default:
                return "rounded-3xl";
        }
    };

    const getFontSizeClass = (size) => {
        switch (size) {
            case "sm": return "text-xs";
            case "base": return "text-sm";
            case "xl": return "text-lg";
            case "2xl": return "text-xl font-bold";
            case "3xl": return "text-2xl font-black";
            case "4xl": return "text-3xl font-black";
            case "lg":
            default:
                return "text-base";
        }
    };

    const getFontWeightClass = (weight) => {
        switch (weight) {
            case "medium": return "font-medium";
            case "bold": return "font-bold";
            case "black": return "font-black";
            case "normal":
            default:
                return "font-normal";
        }
    };

    const getBackgroundStyle = (popup) => {
        if (!popup.isGradient) {
            return { backgroundColor: popup.backgroundColor };
        }
        
        const start = popup.backgroundColor || "#000000";
        const end = popup.gradientColor || "#111111";
        
        switch (popup.gradientDirection) {
            case "to-b":
                return { background: `linear-gradient(to bottom, ${start}, ${end})` };
            case "to-tr":
                return { background: `linear-gradient(to top right, ${start}, ${end})` };
            case "radial":
                return { background: `radial-gradient(circle, ${start}, ${end})` };
            case "to-r":
            default:
                return { background: `linear-gradient(to right, ${start}, ${end})` };
        }
    };

    const getImageFilterStyle = (filters) => {
        if (!filters) return {};
        const { blur = 0, brightness = 100, contrast = 100, grayscale = 0, sepia = 0 } = filters;
        return {
            filter: `blur(${blur}px) brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`
        };
    };

    return (
        <>
            {/* 1. guest LOGIN PROMPT MODAL */}
            <AnimatePresence>
                {showLoginPrompt && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-surface border border-border-theme/60 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={handleDismissLoginPrompt}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border-theme flex items-center justify-center text-foreground/45 hover:text-accent hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
                            >
                                <i className="ri-close-line text-lg" />
                            </button>

                            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-6">
                                <i className="ri-user-shared-line text-3xl" />
                            </div>

                            <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono bg-accent/15 px-2.5 py-1 rounded-full">
                                Guest Account
                            </span>

                            <h3 className="text-xl font-black tracking-tight text-foreground mt-4 leading-tight">
                                Unlock Premium Drops
                            </h3>
                            <p className="text-foreground/45 text-xs font-semibold mt-2.5 leading-relaxed">
                                Create an account or sign in now to experience custom cart recommendations, exclusive wishlists, and seamless order dispatching.
                            </p>

                            <div className="flex flex-col gap-2 mt-6">
                                <button
                                    onClick={handleLoginRedirect}
                                    className="w-full py-3.5 bg-accent text-accent-content hover:bg-accent/90 rounded-2xl text-xs font-black tracking-widest uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                    Login / Register
                                </button>
                                <button
                                    onClick={handleDismissLoginPrompt}
                                    className="w-full py-3.5 bg-transparent text-foreground/45 hover:text-foreground rounded-2xl text-xs font-black tracking-widest uppercase active:scale-95 transition-all cursor-pointer"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2. REAL-TIME PROMOTIONS CAMPAIGN POPUP */}
            <AnimatePresence>
                {showPromoPopup && activePopups && activePopups.length > 0 && (
                    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-[4px]">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`${
                                activePopups[currentSlideIndex].text === "Canvas Compiled Poster"
                                    ? "max-w-[95vw] sm:max-w-lg md:max-w-xl border-none shadow-none bg-transparent"
                                    : `${getModalSizeClass(activePopups[currentSlideIndex].size)} border border-white/10`
                            } ${getBorderRadiusClass(activePopups[currentSlideIndex].borderRadius)} shadow-2xl relative overflow-hidden flex flex-col`}
                            style={
                                activePopups[currentSlideIndex].text === "Canvas Compiled Poster"
                                    ? { background: "transparent" }
                                    : getBackgroundStyle(activePopups[currentSlideIndex])
                            }
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleDismissPromo}
                                className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
                            >
                                <i className="ri-close-line text-lg" />
                            </button>

                            {/* Slideshow Elements */}
                            <div className="flex-1 flex flex-col justify-center relative min-h-[300px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSlideIndex}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-full h-full flex flex-col"
                                    >
                                        {(() => {
                                            const popup = activePopups[currentSlideIndex];
                                            const isCompiled = popup.text === "Canvas Compiled Poster";
                                            
                                            const handleRedirect = () => {
                                                if (!popup.linkUrl) return;
                                                setShowPromoPopup(false);
                                                const link = popup.linkUrl;
                                                if (link.startsWith("http")) {
                                                    window.open(link, "_blank");
                                                } else {
                                                    navigate(link);
                                                }
                                            };

                                            return (
                                                <>
                                                    {/* Image Box */}
                                                    {(popup.imageUrl || popup.deviceImages) && (() => {
                                                        const imgUrl = popup.deviceImages?.[deviceType] || popup.imageUrl;
                                                        if (!imgUrl) return null;
                                                        return (
                                                            <div 
                                                                className={`w-full flex items-center justify-center relative ${isCompiled ? "cursor-pointer" : "max-h-[350px] overflow-hidden"}`}
                                                                onClick={isCompiled ? handleRedirect : undefined}
                                                            >
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={popup.title}
                                                                    className={`${isCompiled ? "w-full h-auto max-h-[80vh] object-contain" : "w-full h-full object-cover"} select-none`}
                                                                    style={getImageFilterStyle(popup.imageFilter)}
                                                                />
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Description Content (Hide for Canvas Compiled Posters) */}
                                                    {popup.text && !isCompiled && (
                                                        <div className="p-8 flex-1 flex flex-col justify-center">
                                                            <p
                                                                className={`leading-relaxed uppercase ${getFontSizeClass(popup.fontSize)} ${getFontWeightClass(popup.fontWeight)}`}
                                                                style={{
                                                                    color: popup.textColor,
                                                                    textAlign: popup.textAlign
                                                                }}
                                                            >
                                                                {popup.text}
                                                            </p>

                                                            {/* Redirect link button */}
                                                            {popup.linkUrl && (
                                                                <div className="mt-6 flex justify-center">
                                                                    <button
                                                                        onClick={handleRedirect}
                                                                        className="px-6 py-2.5 bg-white text-black hover:bg-white/95 text-[10px] font-black tracking-widest uppercase rounded-xl shadow transition-all cursor-pointer active:scale-95"
                                                                    >
                                                                        View Promotion
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Slideshow Controls (Only show if multiple popups active) */}
                            {activePopups.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-6 z-20">
                                    {/* Left Arrow */}
                                    <button
                                        onClick={handlePrevSlide}
                                        className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 cursor-pointer"
                                    >
                                        <i className="ri-arrow-left-s-line text-lg" />
                                    </button>

                                    {/* Slide Indicators */}
                                    <div className="flex gap-1.5 items-center">
                                        {activePopups.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentSlideIndex(idx)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === currentSlideIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                                                }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Right Arrow */}
                                    <button
                                        onClick={handleNextSlide}
                                        className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 cursor-pointer"
                                    >
                                        <i className="ri-arrow-right-s-line text-lg" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PopupManager;
