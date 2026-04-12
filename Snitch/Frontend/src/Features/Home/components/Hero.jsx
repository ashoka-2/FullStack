import React, { useState } from 'react';
import LeftInfo from './LeftInfo';
import RightInfo from './RightInfo';



const BigText = ({ text }) => {
    return (
        <span className="font-black text-[5.5rem] sm:text-[7rem] lg:text-[8rem] leading-[0.75] tracking-tighter uppercase text-foreground dark:text-accent drop-shadow-lg" style={{ fontFamily: 'Impact, sans-serif' }}>{text}</span>
    )
}

const SmallText = ({ text }) => {
    return (
        <span className="font-serif italic text-3xl sm:text-4xl lg:text-[3rem] text-foreground mb-[0px] sm:mb-[0px] lg:mb-[-1px] drop-shadow-md lg:whitespace-nowrap z-10 relative">{text}</span>
    )
}


const HeroHeader = () => {
    return (
        <div className="w-full max-w-[1350px] flex flex justify-between items-center lg:items-end px-4 sm:px-8 z-20 relative mb-12 lg:mb-[-30px]">

            {/* Left Side: Own the EDGE */}
            <div className="flex flex-col transform lg:rotate-[-2deg] text-center lg:text-left z-20">
                <SmallText text="Own the" />
                <div className="relative lg:ml-8">
                    <BigText text="EDGE" />
                </div>
            </div>

            {/* Right Side: Keep the VIBE */}
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 transform lg:rotate-[-2deg] mt-8 lg:mt-0 text-center lg:text-left z-20 xl:mr-10">
                <SmallText text="Keep the" />
                <div className="relative">
                    <BigText text="VIBE" />
                </div>
            </div>
        </div>
    )
}


const Hero = () => {
    const [imgErr, setImgErr] = useState(false);

    return (
        <div className="w-full pb-16 flex flex-col items-center overflow-x-hidden pt-4">

            <HeroHeader />

            {/* Master Hero Container - Colored box and floating Model */}
            <div className="relative w-full max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 z-10 w-[98%]">

                {/* 2. Main Colored Background Block */}
                <div className="w-full h-full lg:h-[500px] bg-surface-brand rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row shadow-xl lg:shadow-2xl z-0 border border-border-theme overflow-visible lg:overflow-hidden">

                    {/* Decorative Circle underneath LeftInfo */}
                    <div className="absolute left-[-10%] top-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-white/10 dark:bg-white/5 rounded-full z-0 opacity-60 blur-[30px] sm:blur-[60px]"></div>

                    {/* Left Info Column */}
                    <div className="w-full lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-16 pt-[80px] pb-12 lg:py-0 flex flex-col justify-center h-full">
                        <LeftInfo />
                    </div>

                    {/* Empty Gutter for Model */}
                    <div className="hidden lg:block lg:w-[30%] h-[350px] lg:h-full"></div>

                    {/* Right Info Column (DESKTOP) */}
                    <div className="hidden lg:flex lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-12 flex-col lg:items-end justify-center pt-8 pb-[100px] lg:py-0 h-full">
                        <RightInfo />
                    </div>

                </div>

                {/* 3. The Model - Anchored securely with responsive assets */}
                <div className="absolute bottom-[52%] md:bottom-[50%] lg:bottom-[24px] lg:left-1/2 right-[-30%] -translate-x-1/2 w-[280px] sm:w-[380px] lg:w-[570px] xl:w-[580px] z-50 pointer-events-none flex justify-center">
                    {/* Desktop Model */}
                    <img
                        src="/model.png"
                        alt="Fashion Cutout"
                        className="hidden lg:block w-[110%] h-auto max-h-[850px] object-contain object-bottom translate-y-6"
                        onError={() => setImgErr(true)}
                    />
                    {/* Mobile Model */}
                    <img
                        src="/model-cutout.png"
                        alt="Mobile Fashion Cutout"
                        className="lg:hidden block w-[110%] h-auto max-h-[850px] object-contain object-bottom translate-y-2"
                        onError={() => setImgErr(true)}
                    />
                </div>

                {/* 4. Right Info Column (MOBILE) */}
                <div className="lg:hidden w-full mt-24">
                    <RightInfo />
                </div>

            </div>

        </div>
    );
};

export default Hero;
