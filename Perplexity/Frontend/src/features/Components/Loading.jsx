import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Loading component that renders an initial loading sequence.
 * authReady indicates whether initial user authentication data has loaded.
 */
const Loading = ({ onFinished, authReady = true }) => {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const counterContainerRef = useRef(null);
  const counterTextRef = useRef(null);

  // Both conditions must be satisfied before exiting:
  // 1. Percentage counter reaches 100
  // 2. authReady is true (initial auth data is loaded)
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Set initial positions: bars cover the full viewport
      gsap.set(barsRef.current, { yPercent: 0 });
      gsap.set(counterContainerRef.current, { opacity: 0, y: 20 });
      
      const tl = gsap.timeline({
        onComplete: () => {
          setAnimationDone(true);
        }
      });

      // Animate percentage counter in
      tl.to(counterContainerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      });

      // Rapidly count from 0 to 100%
      let count = { value: 0 };
      tl.to(count, {
        value: 100,
        duration: 2.0,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counterTextRef.current) {
            counterTextRef.current.innerText = Math.floor(count.value);
          }
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  // Monitor when both animation and auth are completed
  useEffect(() => {
    if (!animationDone || !authReady) return;

    let ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          if (onFinished) onFinished();
        }
      });

      // Fade out counter
      exitTl.to(counterContainerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.4,
        ease: "power2.in"
      });

      // Stagger vertical curtain lift
      exitTl.to(barsRef.current, {
        yPercent: -100,
        duration: 0.8,
        stagger: 0.1,
        ease: "power4.inOut"
      }, "-=0.2");
      
    }, containerRef);

    return () => ctx.revert();
  }, [animationDone, authReady, onFinished]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[9999] overflow-hidden pointer-events-none"
    >
      {/* 5 vertical backdrop bars */}
      <div className="absolute inset-0 flex pointer-events-auto bg-transparent">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className={`flex-1 w-full h-full shadow-2xl origin-top ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#60A6AF]'}`}
          />
        ))}
      </div>

      {/* Percentage Counter in bottom-left */}
      <div
        ref={counterContainerRef}
        className="absolute bottom-10 left-10 md:bottom-20 md:left-20 z-50 pointer-events-none"
      >
        <div className="flex flex-col gap-0">
          <div className="flex items-baseline gap-2 overflow-hidden">
            <span 
              ref={counterTextRef}
              className="text-white text-7xl md:text-[8rem] font-black tracking-tighter leading-none tabular-nums italic drop-shadow-xl"
            >
              0
            </span>
            <span className="text-[#60A6AF] text-3xl md:text-5xl font-light opacity-90 drop-shadow-xl">%</span>
          </div>
        </div>
      </div>

      {/* Subtle overlay texture */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none mix-blend-overlay bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E&quot;)]" />
    </div>
  );
};

export default Loading;