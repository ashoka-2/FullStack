import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Ye Loading component app ko smoothly shuru karne ke liye banaya gaya hai.
// Isme authReady prop ka matlab hai ki kya backend se user detail aa chuki hain
const Loading = ({ onFinished, authReady = true }) => {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const counterContainerRef = useRef(null);
  const counterTextRef = useRef(null);

  // Jab Tak dono conditions true na ho tab tak exit nai marna:
  // 1. Percentage counter 100 tak pahonch gya hai
  // 2. authReady true hai (matlab app ka data background me set hai) 
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Shuru me elements ko tayiar karte hain
      // Bars poori screen par 100% honge (Matlab parda gira hua hai)
      gsap.set(barsRef.current, { yPercent: 0 });
      gsap.set(counterContainerRef.current, { opacity: 0, y: 20 });
      
      const tl = gsap.timeline({
        onComplete: () => {
          // Counter ko 100 tak ghumane ka animation khtam hone par state mark karenge
          setAnimationDone(true);
        }
      });

      // Percent counter ko halka sa neeche se upar (fade in) aane ka effect
      tl.to(counterContainerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      });

      // Zero se 100% tak rapidly count karwana
      let count = { value: 0 };
      tl.to(count, {
        value: 100,
        duration: 2.0, // 2 seconds me 0 se 100 tak jayega
        ease: "power2.inOut",
        onUpdate: () => {
          // React state avoid kar rhe hain taaki render load kam pade aur smooth chale
          if (counterTextRef.current) {
            counterTextRef.current.innerText = Math.floor(count.value);
          }
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  // Ek dusri effect banate hain jo continuously dekhegi:
  // Kya animationDone ho gaya AND backend se authReady bhi ho gaya?
  useEffect(() => {
    // Agar dono kaamo me se ek bhi bacha hai toh exit nahi karenge
    if (!animationDone || !authReady) return;

    let ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          // Exit animation ke end par onFinished call karenge, jisse ye Layout se unmount ho jayega
          if (onFinished) onFinished();
        }
      });

      // Sabse pehle counter aur % ko chupa do
      exitTl.to(counterContainerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.4,
        ease: "power2.in"
      });

      // Uske baad 5 bars ko ek ke baad ek staggered upar kheencho (Parda kholne wala effect)
      exitTl.to(barsRef.current, {
        yPercent: -100,
        duration: 0.8,
        stagger: 0.1, // bars ke lift hone me gap deta hai
        ease: "power4.inOut"
      }, "-=0.2"); // Percent hide hote hote hi bars lift karna start karenge
      
    }, containerRef);

    return () => ctx.revert();
  }, [animationDone, authReady, onFinished]);

  return (
    <div
      ref={containerRef}
      // Fixed aur z-index ko high rakha hai taki app ke sabse upar floating rahe
      className="absolute inset-0 z-[9999] overflow-hidden pointer-events-none"
    >
      {/* Container jo 5 dande (bars) rakhega screen block karne ke liye */}
      <div className="absolute inset-0 flex pointer-events-auto bg-transparent">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            // Thoda contrast de rhe hain dark vs light color ke liye premium look ke khatir
            className={`flex-1 w-full h-full shadow-2xl origin-top ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#60A6AF]'}`}
          />
        ))}
      </div>

      {/* Percentage Counter dikhega bottom left side mein */}
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

      {/* Ek noise layer taki background bilkul flat na lage (Apple jaisa effect) */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Loading;