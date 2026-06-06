import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";

const About = () => {
    const { handleGetSettings } = useSettings();
    const { settings, loading } = useSelector((state) => state.settings);

    useEffect(() => {
        handleGetSettings();
    }, []);

    const aboutData = settings?.about || {
        title: "Our Vision",
        content: "Snitch is a brand dedicated to redefining modern fashion.",
        missionStatement: "To deliver high-quality, sustainable fashion to everyone."
    };

    if (loading && !settings) return <div className="min-h-screen flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase">Loading...</div>;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 md:px-12 text-center">
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-foreground">
                {aboutData.title}
            </h1>
            <div className="w-24 h-1 bg-accent mb-12"></div>
            
            <p className="text-xl md:text-3xl font-bold tracking-widest uppercase text-gray-500 mb-12 max-w-4xl leading-relaxed">
                "{aboutData.missionStatement}"
            </p>

            <div className="max-w-3xl text-sm md:text-base font-medium tracking-wide leading-loose text-foreground/80 whitespace-pre-wrap text-left bg-surface/50 p-8 md:p-12 rounded-[2rem] border border-border-theme/50 shadow-2xl">
                {aboutData.content}
            </div>
        </div>
    );
};

export default About;
