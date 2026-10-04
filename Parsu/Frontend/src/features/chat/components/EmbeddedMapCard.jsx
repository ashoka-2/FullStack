import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  RiMapPin2Fill, 
  RiExternalLinkLine, 
  RiAddLine, 
  RiSubtractLine, 
  RiFullscreenLine, 
  RiFullscreenExitLine, 
  RiFileCopyLine, 
  RiCheckLine, 
  RiNavigationLine, 
  RiRoadMapLine, 
  RiEarthLine, 
  RiCarLine, 
  RiWalkLine, 
  RiBusLine, 
  RiSwapLine, 
  RiRouteLine, 
  RiGpsLine, 
  RiCompass3Line,
  RiCloseLine,
  RiFlagLine,
  RiArrowRightSLine
} from '@remixicon/react';

// Helper to parse location strings, structured route configs, and multi-stop road trips
export function parseMapPayload(input) {
  if (!input) return { type: 'place', location: 'Tokyo, Japan', stops: [] };
  
  if (typeof input === 'object') {
    if (input.origin && input.destination) {
      const parsedStops = Array.isArray(input.stops)
        ? input.stops.map(s => String(s).trim()).filter(Boolean)
        : (input.stops ? String(input.stops).split(/[,|•;]+/).map(s => s.trim()).filter(Boolean) : []);
      return {
        type: 'directions',
        origin: input.origin,
        destination: input.destination,
        travelMode: input.travelMode || input.mode || 'driving',
        stops: parsedStops
      };
    }
    return { type: 'place', location: input.location || 'Tokyo, Japan', stops: [] };
  }

  let text = String(input).trim();
  // Strip backticks if passed raw markdown code
  text = text.replace(/^`+|`+$/g, '').trim();

  // Strip leading directive prefixes (e.g., "map ", "maps: ", "route: ", "directions: ")
  const stripped = text.replace(/^(?:map|maps|googlemap|googlemaps|directions?|route|trip):\s*/i, '')
                       .replace(/^(?:map|maps|googlemap|googlemaps)\s+/i, '')
                       .trim();

  // 1. Multi-arrow route: "A -> B -> C -> D" or "A → B → C → D"
  const arrowParts = stripped.split(/\s*(?:->|→)\s*/).map(p => p.trim()).filter(Boolean);
  if (arrowParts.length >= 3 && !stripped.includes('\n')) {
    return {
      type: 'directions',
      origin: arrowParts[0],
      destination: arrowParts[arrowParts.length - 1],
      travelMode: 'driving',
      stops: arrowParts.slice(1, -1)
    };
  }

  // 2. Structured key-value format (from: ..., stops/via/waypoints: ..., to: ..., mode: ...)
  const fromMatch = text.match(/(?:from|origin|start):\s*([^\n\r]+)/i);
  const toMatch = text.match(/(?:to|destination|end):\s*([^\n\r]+)/i);
  const modeMatch = text.match(/(?:mode|travelMode):\s*([^\n\r]+)/i);
  const stopsMatch = text.match(/(?:stops|waypoints|via|intermediate):\s*([^\n\r]+)/i);
  const multiStopLines = [...text.matchAll(/(?:^|\n)\s*(?:stop|via|waypoint):\s*([^\n\r]+)/gi)].map(m => m[1].trim());

  let structuredStops = [];
  if (stopsMatch && stopsMatch[1]) {
    structuredStops = stopsMatch[1].split(/[,|•;]+/).map(s => s.trim()).filter(Boolean);
  } else if (multiStopLines.length > 0) {
    structuredStops = multiStopLines.filter(Boolean);
  }

  // Also support multi-line stops block between "stops:" and "to:"
  const stopsBlockMatch = text.match(/(?:stops|waypoints|via|intermediate):\s*\n([\s\S]*?)(?=\n\s*(?:to|destination|end|mode):|$)/i);
  if (stopsBlockMatch && stopsBlockMatch[1]) {
    const blockStops = stopsBlockMatch[1]
      .split(/[\n,;•|]+/)
      .map(s => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(s => s.length > 1 && !/^(?:to|mode):/i.test(s));
    if (blockStops.length > 0) {
      structuredStops = blockStops;
    }
  }

  if (fromMatch && toMatch) {
    return {
      type: 'directions',
      origin: fromMatch[1].trim(),
      destination: toMatch[1].trim(),
      travelMode: modeMatch ? modeMatch[1].trim().toLowerCase() : 'driving',
      stops: structuredStops
    };
  }

  // 3. Pattern: "from X to Y via A, B, C" or "from X via A, B, C to Y"
  const viaBeforeTo = stripped.match(/^(?:(?:directions?|route|trip|travel)\s+(?:from\s+)?)?(?:from\s+)?(.+?)\s+(?:via|through|with stops in|with stops at)\s+(.+?)\s+to\s+(.+?)(?:\s+(?:by|via|mode)\s+(driving|transit|walking|bicycling))?$/i);
  if (viaBeforeTo && viaBeforeTo[1] && viaBeforeTo[2] && viaBeforeTo[3]) {
    const rawStops = viaBeforeTo[2].split(/[,|•;]+/).map(s => s.trim()).filter(Boolean);
    return {
      type: 'directions',
      origin: viaBeforeTo[1].trim(),
      destination: viaBeforeTo[3].trim(),
      travelMode: (viaBeforeTo[4] || 'driving').toLowerCase(),
      stops: rawStops
    };
  }

  const viaAfterTo = stripped.match(/^(?:(?:directions?|route|trip|travel)\s+(?:from\s+)?)?(?:from\s+)?(.+?)\s+to\s+(.+?)\s+(?:via|through|with stops in|with stops at)\s+(.+?)(?:\s+(?:by|mode)\s+(driving|transit|walking|bicycling))?$/i);
  if (viaAfterTo && viaAfterTo[1] && viaAfterTo[2] && viaAfterTo[3]) {
    const rawStops = viaAfterTo[3].split(/[,|•;]+/).map(s => s.trim()).filter(Boolean);
    return {
      type: 'directions',
      origin: viaAfterTo[1].trim(),
      destination: viaAfterTo[2].trim(),
      travelMode: (viaAfterTo[4] || 'driving').toLowerCase(),
      stops: rawStops
    };
  }

  // 4. Pattern: "directions from X to Y", "X to Y", "map Thalassery, Kerala, India to Kannur, Kerala, India"
  const routeMatch = stripped.match(/^(?:(?:directions?|route|trip|travel)\s+(?:from\s+)?)?(?:from\s+)?(.+?)\s+(?:to|->|→)\s+(.+?)(?:\s+(?:by|via|mode)\s+(driving|transit|walking|bicycling))?$/i);
  if (routeMatch && routeMatch[1] && routeMatch[2] && !stripped.includes('\n')) {
    const rawOrigin = routeMatch[1].replace(/^(?:directions?\s+from|route\s+from|trip\s+from|from)\s+/i, '').trim();
    const rawDest = routeMatch[2].trim();
    if (rawOrigin && rawDest && rawOrigin.toLowerCase() !== rawDest.toLowerCase()) {
      return {
        type: 'directions',
        origin: rawOrigin,
        destination: rawDest,
        travelMode: (routeMatch[3] || 'driving').toLowerCase(),
        stops: structuredStops
      };
    }
  }

  return { type: 'place', location: stripped || text, stops: [] };
}

export const EmbeddedMapCard = ({ 
  location = 'Tokyo, Japan', 
  origin: propOrigin = '',
  destination: propDestination = '',
  stops: propStops = null,
  mode: propMode = '',
  title = '', 
  initialZoom = 14, 
  initialView = 'roadmap' 
}) => {
  // Parse input payload
  const initialPayload = React.useMemo(() => {
    if (propOrigin && propDestination) {
      const parsedStops = Array.isArray(propStops) 
        ? propStops 
        : (propStops ? String(propStops).split(/[,|•;]+/).map(s => s.trim()).filter(Boolean) : []);
      return {
        type: 'directions',
        origin: propOrigin,
        destination: propDestination,
        stops: parsedStops,
        travelMode: propMode || 'driving'
      };
    }
    return parseMapPayload(location);
  }, [location, propOrigin, propDestination, propStops, propMode]);

  const [isDirections, setIsDirections] = useState(initialPayload.type === 'directions');
  const [origin, setOrigin] = useState(initialPayload.origin || 'My Location');
  const [destination, setDestination] = useState(initialPayload.destination || initialPayload.location || 'Tokyo, Japan');
  const [stops, setStops] = useState(initialPayload.stops || []);
  const [travelMode, setTravelMode] = useState(initialPayload.travelMode || 'driving'); // driving | transit | walking
  const [viewType, setViewType] = useState(initialView); // roadmap (m) | satellite (k)
  const [zoom, setZoom] = useState(initialZoom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsAddressLabel, setGpsAddressLabel] = useState('');
  const [activeStopPreview, setActiveStopPreview] = useState(null);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [newStopInput, setNewStopInput] = useState('');

  // Update state when initialPayload changes
  useEffect(() => {
    if (initialPayload.type === 'directions') {
      setIsDirections(true);
      setOrigin(initialPayload.origin);
      setDestination(initialPayload.destination);
      setStops(initialPayload.stops || []);
      if (initialPayload.travelMode) setTravelMode(initialPayload.travelMode);
    } else {
      setIsDirections(false);
      setDestination(initialPayload.location);
      setStops([]);
    }
    setActiveStopPreview(null);
    setIsLoading(true);
  }, [initialPayload]);

  // Clean values
  const cleanDest = destination.trim();
  const cleanOrigin = origin.trim();
  const cleanStops = stops.map(s => s.trim()).filter(Boolean);
  const isFromCurrentLocation = cleanOrigin.toLowerCase() === 'my location' || cleanOrigin.toLowerCase() === 'current location' || !cleanOrigin;

  // Google Maps dirflg codes: d = driving, r = public transit, w = walking, b = bicycling
  const dirFlgMap = {
    driving: 'd',
    transit: 'r',
    walking: 'w',
    bicycling: 'b'
  };
  const activeDirFlg = dirFlgMap[travelMode] || 'd';
  const mapTypeParam = viewType === 'satellite' ? 'k' : 'm';

  // Construct Google Maps universal embed URL
  let embedUrl = '';
  if (isDirections) {
    if (activeStopPreview) {
      // Focus map view on single selected preview waypoint
      embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeStopPreview)}&t=${mapTypeParam}&z=${Math.max(zoom, 14)}&ie=UTF8&iwloc=&output=embed`;
    } else {
      // Multi-stop route: connect all waypoints sequentially to destination
      const allWaypointsAndDest = cleanStops.length > 0 
        ? [...cleanStops, cleanDest].join(' to:')
        : cleanDest;

      if (isFromCurrentLocation) {
        embedUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(allWaypointsAndDest)}&dirflg=${activeDirFlg}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
      } else {
        embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(cleanOrigin)}&daddr=${encodeURIComponent(allWaypointsAndDest)}&dirflg=${activeDirFlg}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
      }
    }
  } else {
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cleanDest)}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  // Construct direct Google Maps navigation URLs (with pipe-separated waypoints standard)
  const waypointsParam = cleanStops.length > 0 ? `&waypoints=${encodeURIComponent(cleanStops.join('|'))}` : '';
  const externalMapsUrl = isDirections
    ? `https://www.google.com/maps/dir/?api=1&origin=${isFromCurrentLocation ? '' : encodeURIComponent(cleanOrigin)}&destination=${encodeURIComponent(cleanDest)}${waypointsParam}&travelmode=${travelMode}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDest)}${waypointsParam}&travelmode=${travelMode}`;

  // Swap Origin and Destination (and reverse all stops)
  const handleSwapLocations = (e) => {
    e.stopPropagation();
    if (!isDirections) return;
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setStops(prev => [...prev].reverse());
    setActiveStopPreview(null);
    setIsLoading(true);
  };

  // Remove a stop
  const handleRemoveStop = (idx, e) => {
    e.stopPropagation();
    setStops(prev => prev.filter((_, i) => i !== idx));
    setActiveStopPreview(null);
    setIsLoading(true);
  };

  // Add a stop
  const handleAddStop = (e) => {
    e.preventDefault();
    if (!newStopInput.trim()) return;
    setStops(prev => [...prev, newStopInput.trim()]);
    setNewStopInput('');
    setIsAddingStop(false);
    setActiveStopPreview(null);
    setIsLoading(true);
  };

  // Get user's live GPS coordinates
  const handleUseMyLocation = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      setOrigin('Current Location');
      return;
    }
    setIsGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
        setOrigin(coordsStr);
        setGpsAddressLabel('Current GPS Location 📍');
        setIsGpsLocating(false);
        setIsLoading(true);
      },
      () => {
        setOrigin('Current Location');
        setIsGpsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 1, 20));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 1, 3));
  };

  const handleCopySummary = (e) => {
    e.stopPropagation();
    const textToCopy = isDirections 
      ? `Route: ${cleanOrigin}${cleanStops.length > 0 ? ` via ${cleanStops.join(' ➔ ')}` : ''} to ${cleanDest} (${travelMode})`
      : cleanDest;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Escape key and body scroll lock for true fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const renderCardContent = (isFs = false) => {
    return (
      <div className={`overflow-hidden transition-all ${
        isFs
          ? 'fixed inset-0 w-screen h-screen z-[99999999] bg-white dark:bg-zinc-950 flex flex-col m-0 p-0 rounded-none border-0 shadow-2xl'
          : 'relative group my-4 rounded-2xl md:rounded-3xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[var(--bg-surface)] shadow-xl backdrop-blur-xl w-full max-w-2xl flex flex-col'
      }`}>
        {/* Top Header Bar */}
        <div className="flex flex-col gap-2 p-3 sm:p-4 bg-zinc-100/90 dark:bg-white/[0.03] border-b border-zinc-200/80 dark:border-white/5 select-none shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDirections ? 'bg-cyan-500/10 text-[var(--accent-cyan)]' : 'bg-rose-500/10 text-rose-500'
              }`}>
                {isDirections ? (
                  <RiRouteLine size={18} className="animate-pulse" />
                ) : (
                  <RiMapPin2Fill size={18} className="animate-bounce" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                    {title || (isDirections ? `${cleanOrigin} ➔ ${cleanDest}` : cleanDest)}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] font-bold">
                    {isDirections ? 'Live Route' : 'Live Map'}
                  </span>
                  {isDirections && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
                      {cleanStops.length > 0 ? `${cleanStops.length + 2} Point Road Trip` : 'Direct Route'}
                    </span>
                  )}
                  {isFs && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
                      Full Screen View
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {isDirections 
                    ? `Interactive Trip Directions & Navigation • ${travelMode.toUpperCase()}${cleanStops.length > 0 ? ` • ${cleanStops.length} stops included` : ''}`
                    : 'Interactive Google Maps Embed • Street & Satellite'}
                </p>
              </div>
            </div>

            {/* Quick Controls: Satellite & Zoom & Fullscreen Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Map View Toggle (Roadmap vs Satellite) */}
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/70 dark:bg-white/10 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setViewType('roadmap')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                    viewType === 'roadmap'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Roadmap View"
                >
                  <RiRoadMapLine size={13} />
                  <span className="hidden md:inline">Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('satellite')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                    viewType === 'satellite'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Satellite View"
                >
                  <RiEarthLine size={13} />
                  <span className="hidden md:inline">Sat</span>
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-800/80">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 20}
                  className="p-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <RiAddLine size={15} />
                </button>
                <span className="px-1.5 text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  {zoom}x
                </span>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 3}
                  className="p-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <RiSubtractLine size={15} />
                </button>
              </div>

              {/* Fullscreen Button */}
              {isFs ? (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  title="Exit Fullscreen (Esc)"
                >
                  <RiFullscreenExitLine size={15} />
                  <span className="hidden sm:inline">Exit (Esc)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Expand to Full Screen"
                >
                  <RiFullscreenLine size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Directions Cockpit Row (if directions mode) */}
          {isDirections && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5">
              {/* Origin -> Destination Pill with Swap */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 flex-1 min-w-[220px]">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[11px] shrink-0">From:</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                  {gpsAddressLabel || cleanOrigin}
                </span>

                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Reverse Route (Swap Origin & Destination)"
                >
                  <RiSwapLine size={15} />
                </button>

                <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[11px] shrink-0">To:</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 font-bold text-[var(--accent-cyan)] truncate max-w-[120px] sm:max-w-[200px]">
                  {cleanDest}
                </span>
              </div>

              {/* Travel Mode Pills & GPS */}
              <div className="flex items-center gap-1.5">
                {/* GPS Current Location Button */}
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGpsLocating}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    isFromCurrentLocation
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-[var(--accent-cyan)]'
                  }`}
                  title="Set starting point to My Current GPS Location"
                >
                  <RiGpsLine size={13} className={isGpsLocating ? "animate-spin text-emerald-500" : ""} />
                  <span className="hidden xs:inline">My Location</span>
                </button>

                {/* Mode Selector (Drive / Transit / Walk) */}
                <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/70 dark:bg-white/10 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => { setTravelMode('driving'); setIsLoading(true); }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      travelMode === 'driving'
                        ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="Driving Route (Cars & Bikes)"
                  >
                    <RiCarLine size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTravelMode('transit'); setIsLoading(true); }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      travelMode === 'transit'
                        ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="Public Transit (Metro / Bus / Train)"
                  >
                    <RiBusLine size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTravelMode('walking'); setIsLoading(true); }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      travelMode === 'walking'
                        ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="Walking Route"
                  >
                    <RiWalkLine size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trip Waypoints & Stops Drawer */}
          {isDirections && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <RiRouteLine size={12} className="text-[var(--accent-cyan)]" />
                    Trip Itinerary ({cleanStops.length} intermediate stop{cleanStops.length === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeStopPreview && (
                    <button
                      type="button"
                      onClick={() => { setActiveStopPreview(null); setIsLoading(true); }}
                      className="text-[10px] px-2 py-0.5 rounded font-bold bg-[var(--accent-cyan)] text-zinc-950 hover:opacity-90 transition-all cursor-pointer"
                    >
                      Show Full Route
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddingStop(prev => !prev)}
                    className="text-[10px] px-2 py-0.5 rounded font-semibold text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <RiAddLine size={12} />
                    <span>Add Stop</span>
                  </button>
                </div>
              </div>

              {/* Form to add a custom stop */}
              {isAddingStop && (
                <form onSubmit={handleAddStop} className="flex items-center gap-1.5 my-1">
                  <input
                    type="text"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    placeholder="Enter stop (e.g., Goa, Mumbai, Surat...)"
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[var(--accent-cyan)]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--accent-cyan)] text-zinc-950 hover:bg-[var(--accent-cyan-hover)] transition-all cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingStop(false); setNewStopInput(''); }}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <RiCloseLine size={15} />
                  </button>
                </form>
              )}

              {/* Horizontal Scrollable Waypoint Timeline Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {/* Starting point badge */}
                <div 
                  onClick={() => { setActiveStopPreview(null); setIsLoading(true); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold shrink-0 cursor-pointer transition-all border ${
                    !activeStopPreview 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                  }`}
                  title="Origin / Start of journey"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[100px]">{cleanOrigin}</span>
                </div>

                {cleanStops.map((stop, idx) => (
                  <React.Fragment key={`${stop}-${idx}`}>
                    <RiArrowRightSLine size={13} className="text-zinc-400 shrink-0" />
                    <div 
                      onClick={() => { setActiveStopPreview(stop); setIsLoading(true); }}
                      className={`group/chip flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-md text-[11px] font-medium shrink-0 cursor-pointer transition-all border ${
                        activeStopPreview === stop
                          ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border-[var(--accent-cyan)] shadow-xs font-bold'
                          : 'bg-white dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-[var(--accent-cyan)]/40'
                      }`}
                      title={`Stop ${idx + 1}: ${stop} (Click to focus on map)`}
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[120px]">{stop}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveStop(idx, e)}
                        className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-400 hover:text-red-500 transition-colors ml-0.5"
                        title="Remove stop"
                      >
                        <RiCloseLine size={12} />
                      </button>
                    </div>
                  </React.Fragment>
                ))}

                {/* Destination badge */}
                <RiArrowRightSLine size={13} className="text-zinc-400 shrink-0" />
                <div 
                  onClick={() => { setActiveStopPreview(null); setIsLoading(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold shrink-0 cursor-pointer transition-all border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  title="Destination (Final Stop)"
                >
                  <RiFlagLine size={12} className="text-rose-500" />
                  <span className="truncate max-w-[110px]">{cleanDest}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Google Maps Viewport */}
        <div className={`relative w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden ${
          isFs ? 'flex-1 min-h-0' : 'h-64 sm:h-84'
        }`}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-xs gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {isDirections ? 'Calculating optimal route...' : 'Loading Google Map...'}
              </span>
            </div>
          )}

          <iframe
            key={`${cleanOrigin}-${cleanDest}-${travelMode}-${viewType}-${zoom}-${isFs}`}
            title={`Map for ${cleanDest}`}
            src={embedUrl}
            width="100%"
            height="100%"
            className="w-full h-full border-0 select-none"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Card Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-white/5 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Copy details to clipboard"
            >
              {copied ? (
                <>
                  <RiCheckLine size={13} className="text-emerald-500 font-bold" />
                  <span className="text-emerald-500 font-semibold text-[11px]">Copied!</span>
                </>
              ) : (
                <>
                  <RiFileCopyLine size={13} />
                  <span className="text-[11px] font-medium">{isDirections ? 'Copy Route' : 'Copy Place'}</span>
                </>
              )}
            </button>

            {isDirections ? (
              <button
                type="button"
                onClick={() => setIsDirections(false)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
                title="Switch to single destination pin view"
              >
                <RiCompass3Line size={13} />
                <span>Pin Only</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsDirections(true); setIsLoading(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer text-[11px] font-semibold"
                title="Get directions from my location to this place"
              >
                <RiRouteLine size={13} />
                <span>Get Directions</span>
              </button>
            )}
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-white/10 transition-colors"
              title="Open Directions in Google Maps"
            >
              <RiNavigationLine size={13} className="text-blue-500" />
              <span className="hidden xs:inline">Navigate</span>
            </a>

            <a
              href={externalMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11px] bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 transition-all shadow-xs cursor-pointer"
            >
              <span>{isDirections ? 'Start in Google Maps' : 'Open in Google Maps'}</span>
              <RiExternalLinkLine size={13} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderCardContent(false)}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        renderCardContent(true),
        document.body
      )}
    </>
  );
};

export default EmbeddedMapCard;
