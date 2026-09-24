import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * ShapeOverlaysTransition — Unidirectional Top-to-Bottom Organic Liquid Wave Transition
 * Blake Bowen's organic multi-path Bezier curve algorithm flowing strictly downward:
 * 1. Waves pour down from the top to cover the screen.
 * 2. Route navigation occurs while fully covered.
 * 3. Waves continue downward and exit off the bottom, revealing the new page.
 */
export default function ShapeOverlaysTransition() {
  const svgRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const path3Ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const paths = [path1Ref.current, path2Ref.current, path3Ref.current].filter(Boolean);
    if (!paths.length) return;

    const numPoints = 10;
    const numPaths = paths.length;
    const delayPointsMax = 0.1;
    const delayPerPath = 0.07;
    const duration = 0.38;

    let tl = null;

    const handleTrigger = (e) => {
      const onNavigate = e?.detail?.onNavigate;
      const onComplete = e?.detail?.onComplete;

      setIsVisible(true);

      // Initialize all points at 0 (top of viewBox 0 0 100 100)
      const allPoints = [];
      for (let i = 0; i < numPaths; i++) {
        const points = [];
        for (let j = 0; j < numPoints; j++) {
          points.push(0);
        }
        allPoints.push(points);
      }

      const pointsDelay = [];
      for (let i = 0; i < numPoints; i++) {
        pointsDelay[i] = Math.random() * delayPointsMax;
      }

      // Render function strictly flowing downward
      // isExiting = false: Wave pours down from top (y=0 to y=points, anchored to top)
      // isExiting = true: Wave exits downward (y=points to y=100, anchored to bottom)
      const render = (isExiting) => {
        for (let i = 0; i < numPaths; i++) {
          const path = paths[i];
          const points = allPoints[i];
          if (!path || !points) continue;

          let d = isExiting ? `M 0 ${points[0]} C` : `M 0 0 V ${points[0]} C`;

          for (let j = 0; j < numPoints - 1; j++) {
            const p = ((j + 1) / (numPoints - 1)) * 100;
            const cp = p - ((1 / (numPoints - 1)) * 100) / 2;
            d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
          }

          d += isExiting ? ` V 100 H 0 Z` : ` V 0 H 0 Z`;
          path.setAttribute('d', d);
        }
      };

      if (tl) tl.kill();

      // Phase 1: Waves pour down from top (0 -> 100)
      tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration },
        onUpdate: () => render(false),
        onComplete: () => {
          // Screen is completely covered! Perform route navigation
          if (typeof onNavigate === 'function') {
            onNavigate();
          }

          // Reset points to 0 for exit phase (anchored to bottom, points represent top boundary)
          for (let i = 0; i < numPaths; i++) {
            for (let j = 0; j < numPoints; j++) {
              allPoints[i][j] = 0;
            }
          }
          // Immediately set paths to full screen cover in exit geometry
          render(true);

          // Phase 2: Waves continue downward and peel off bottom (0 -> 100)
          gsap.delayedCall(0.04, () => {
            const tlOut = gsap.timeline({
              defaults: { ease: 'power2.inOut', duration: duration * 0.95 },
              onUpdate: () => render(true),
              onComplete: () => {
                setIsVisible(false);
                paths.forEach((p) => p?.setAttribute('d', ''));
                if (typeof onComplete === 'function') onComplete();
              },
            });

            for (let i = 0; i < numPaths; i++) {
              const points = allPoints[i];
              const pathDelay = delayPerPath * (numPaths - i - 1);

              for (let j = 0; j < numPoints; j++) {
                const delay = pointsDelay[j];
                tlOut.to(points, { [j]: 100 }, delay + pathDelay);
              }
            }
          });
        },
      });

      // Animate points from 0 to 100 (pouring down from top to bottom)
      for (let i = 0; i < numPaths; i++) {
        const points = allPoints[i];
        const pathDelay = delayPerPath * i;

        for (let j = 0; j < numPoints; j++) {
          const delay = pointsDelay[j];
          tl.to(points, { [j]: 100 }, delay + pathDelay);
        }
      }
    };

    window.addEventListener('trigger_liquid_transition', handleTrigger);
    return () => {
      window.removeEventListener('trigger_liquid_transition', handleTrigger);
      if (tl) tl.kill();
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] overflow-hidden ${
        isVisible ? 'block' : 'hidden'
      }`}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 preserve-3d"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Foundation wave: deep black to deep charcoal grey */}
          <linearGradient id="liquid-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#08090c" />
            <stop offset="100%" stopColor="#16181f" />
          </linearGradient>

          {/* Middle wave: deep slate grey to signature cyan */}
          <linearGradient id="liquid-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e222c" />
            <stop offset="100%" stopColor="#20b8cd" />
          </linearGradient>

          {/* Leading wave: signature cyan to luminous icy cyan-white */}
          <linearGradient id="liquid-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#20b8cd" />
            <stop offset="100%" stopColor="#a5f3fc" />
          </linearGradient>
        </defs>

        <path ref={path1Ref} className="shape-overlays__path" fill="url(#liquid-grad-1)" />
        <path ref={path2Ref} className="shape-overlays__path" fill="url(#liquid-grad-2)" />
        <path ref={path3Ref} className="shape-overlays__path" fill="url(#liquid-grad-3)" />
      </svg>
    </div>
  );
}
