import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Loading = ({ onFinished }) => {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const counterContainerRef = useRef(null);
  const counterTextRef = useRef(null); // Naya ref direct number update karne ke liye

  useEffect(() => {
    // gsap.context() ensures proper cleanup in React (prevents double firing)
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onFinished) onFinished();
        }
      });

      // 1. Initial states
      gsap.set(barsRef.current, { yPercent: -100 });
      gsap.set(counterContainerRef.current, { opacity: 0, y: 30 });

      // 2. Entrance: Bars drop one by one from top
      tl.to(barsRef.current, {
        yPercent: 0,
        duration: 1.2,
        stagger: 0.1, // Fixed 0.1 delay gives that perfect wave effect
        ease: "power4.inOut"
      });

      // 3. Counter reveals
      tl.to(counterContainerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6");

      // 4. Percentage Counter Simulation (Optimized: No React State used)
      let count = { value: 0 };
      tl.to(count, {
        value: 100,
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: () => {
          // Direct DOM update = Zero React Re-renders = Buttery Smooth Animation
          if (counterTextRef.current) {
            counterTextRef.current.innerText = Math.floor(count.value);
          }
        }
      });

      // 5. Hide Counter before bars leave
      tl.to(counterContainerRef.current, {
        opacity: 0,
        y: -40,
        duration: 0.5,
        ease: "power2.in"
      });

      // 6. Reveal Step: Bars lift back UP one by one
      tl.to(barsRef.current, {
        yPercent: -100,
        duration: 1.2,
        stagger: 0.1, // Goes back one by one in the same order
        ease: "power4.inOut"
      }, "-=0.2"); // Starts slightly before counter fully disappears

    }, containerRef); // Scope everything to the container

    // Cleanup function for React Strict Mode
    return () => ctx.revert();
  }, [onFinished]);

  return (
    <div
      ref={containerRef}
      // Removed solid bg color here so the actual site is revealed underneath!
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none bg-transparent"
    >
      {/* Alternating Bars Container */}
      <div className="absolute inset-0 flex pointer-events-auto">
        {/* Pro tip: 5 bars usually look more symmetrical and premium than 4 */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className={`flex-1 shadow-2xl ${i % 2 === 0 ? 'bg-[#121212]' : 'bg-[#60A6AF]'}`}
          />
        ))}
      </div>

      {/* Percentage Counter - Bottom Left */}
      <div
        ref={counterContainerRef}
        className="absolute bottom-10 left-10 md:bottom-20 md:left-20 z-50 pointer-events-none"
      >
        <div className="flex flex-col gap-0">
          <div className="flex items-baseline gap-2">
            {/* Value is injected via ref, not state */}
            <span 
              ref={counterTextRef}
              className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none tabular-nums italic"
            >
              0
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