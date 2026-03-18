import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

const Loading = ({ onFinished }) => {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const counterRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        onFinished();
      }
    });

    // 1. Initial State: Bars are all tucked up top
    gsap.set(barsRef.current, { yPercent: -100 });

    // 2. Animation Sequence: Bars drop one by one to cover the screen
    tl.to(barsRef.current, {
      yPercent: 0,
      duration: 1.2,
      stagger: 0.1,
      ease: "power4.inOut"
    });

    // 3. Percentage Counter Simulation while screen is covered
    let count = { value: 0 };
    tl.to(count, {
      value: 100,
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        setPercent(Math.floor(count.value));
      }
    });

    // 4. Reveal Step: Bring bars back UP one by one to reveal the real app
    tl.to(barsRef.current, {
      yPercent: -100,
      duration: 1.2,
      stagger: 0.1,
      ease: "power4.inOut",
      delay: 0.2 // Small hold at 100%
    });

    // Hide counter as bars lift
    tl.to(counterRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.in"
    }, "-=1.0"); // Start hiding counter as bars start lifting

    // Fade out main container background to ensure transparency works
    tl.to(containerRef.current, {
      backgroundColor: "transparent",
      duration: 0.1
    }, "-=1.2");

  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none bg-[#0a0a0a]"
    >
      {/* 4 Alternating Bars: Using high-contrast premium colors for the drop */}
      <div className="absolute inset-0 flex pointer-events-auto">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className={`flex-1 shadow-2xl ${i % 2 === 0 ? 'bg-[#121212]' : 'bg-[#60A6AF]'}`}
          />
        ))}
      </div>

      {/* Percentage Counter - Bottom Left */}
      <div
        ref={counterRef}
        className="absolute bottom-10 left-10 md:bottom-20 md:left-20 z-50 pointer-events-none"
      >
        <div className="flex flex-col gap-0">
          <div className="flex items-baseline gap-2">
            <span className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none tabular-nums italic">
              {percent}
            </span>
            <span className="text-[#60A6AF] text-3xl md:text-5xl font-light opacity-80">%</span>
          </div>
        </div>
      </div>

      {/* Subtle Grain Over Screen */}
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Loading;
