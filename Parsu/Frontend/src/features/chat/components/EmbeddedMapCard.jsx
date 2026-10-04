import React, { useState, useEffect } from 'react';
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
  RiCompass3Line
} from '@remixicon/react';

// Helper to parse location strings or structured route configs
export function parseMapPayload(input) {
  if (!input) return { type: 'place', location: 'Tokyo, Japan' };
  
  if (typeof input === 'object') {
    if (input.origin && input.destination) {
      return {
        type: 'directions',
        origin: input.origin,
        destination: input.destination,
        travelMode: input.travelMode || input.mode || 'driving',
        stops: input.stops || []
      };
    }
    return { type: 'place', location: input.location || 'Tokyo, Japan' };
  }

  let text = String(input).trim();
  // Strip backticks if passed raw markdown code
  text = text.replace(/^`+|`+$/g, '').trim();

  // Strip leading directive prefixes (e.g., "map ", "maps: ", "route: ", "directions: ")
  const stripped = text.replace(/^(?:map|maps|googlemap|googlemaps|directions?|route|trip):\s*/i, '')
                       .replace(/^(?:map|maps|googlemap|googlemaps)\s+/i, '')
                       .trim();

  // 1. Structured key-value format:
  // from: Mumbai
  // to: Pune
  // mode: driving
  const fromMatch = text.match(/(?:from|origin|start):\s*([^\n\r]+)/i);
  const toMatch = text.match(/(?:to|destination|end):\s*([^\n\r]+)/i);
  const modeMatch = text.match(/(?:mode|travelMode):\s*([^\n\r]+)/i);

  if (fromMatch && toMatch) {
    return {
      type: 'directions',
      origin: fromMatch[1].trim(),
      destination: toMatch[1].trim(),
      travelMode: modeMatch ? modeMatch[1].trim().toLowerCase() : 'driving'
    };
  }

  // 2. Pattern: "directions from X to Y", "X to Y", "map Thalassery, Kerala, India to Kannur, Kerala, India"
  // Allows any commas in place names (e.g., city, state, country)
  const routeMatch = stripped.match(/^(?:(?:directions?|route|trip|travel)\s+(?:from\s+)?)?(?:from\s+)?(.+?)\s+(?:to|->|→)\s+(.+?)(?:\s+(?:by|via|mode)\s+(driving|transit|walking|bicycling))?$/i);
  if (routeMatch && routeMatch[1] && routeMatch[2] && !stripped.includes('\n')) {
    const rawOrigin = routeMatch[1].replace(/^(?:directions?\s+from|route\s+from|trip\s+from|from)\s+/i, '').trim();
    const rawDest = routeMatch[2].trim();
    if (rawOrigin && rawDest && rawOrigin.toLowerCase() !== rawDest.toLowerCase()) {
      return {
        type: 'directions',
        origin: rawOrigin,
        destination: rawDest,
        travelMode: (routeMatch[3] || 'driving').toLowerCase()
      };
    }
  }

  return { type: 'place', location: stripped || text };
}

export const EmbeddedMapCard = ({ 
  location = 'Tokyo, Japan', 
  origin: propOrigin = '',
  destination: propDestination = '',
  mode: propMode = '',
  title = '', 
  initialZoom = 14, 
  initialView = 'roadmap' 
}) => {
  // Parse input payload
  const initialPayload = React.useMemo(() => {
    if (propOrigin && propDestination) {
      return {
        type: 'directions',
        origin: propOrigin,
        destination: propDestination,
        travelMode: propMode || 'driving'
      };
    }
    return parseMapPayload(location);
  }, [location, propOrigin, propDestination, propMode]);

  const [isDirections, setIsDirections] = useState(initialPayload.type === 'directions');
  const [origin, setOrigin] = useState(initialPayload.origin || 'My Location');
  const [destination, setDestination] = useState(initialPayload.destination || initialPayload.location || 'Tokyo, Japan');
  const [travelMode, setTravelMode] = useState(initialPayload.travelMode || 'driving'); // driving | transit | walking
  const [viewType, setViewType] = useState(initialView); // roadmap (m) | satellite (k)
  const [zoom, setZoom] = useState(initialZoom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsAddressLabel, setGpsAddressLabel] = useState('');

  // Update state when initialPayload changes
  useEffect(() => {
    if (initialPayload.type === 'directions') {
      setIsDirections(true);
      setOrigin(initialPayload.origin);
      setDestination(initialPayload.destination);
      if (initialPayload.travelMode) setTravelMode(initialPayload.travelMode);
    } else {
      setIsDirections(false);
      setDestination(initialPayload.location);
    }
    setIsLoading(true);
  }, [initialPayload]);

  // Clean values
  const cleanDest = destination.trim();
  const cleanOrigin = origin.trim();
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
    if (isFromCurrentLocation) {
      embedUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(cleanDest)}&dirflg=${activeDirFlg}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    } else {
      embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(cleanOrigin)}&daddr=${encodeURIComponent(cleanDest)}&dirflg=${activeDirFlg}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }
  } else {
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cleanDest)}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  // Construct direct Google Maps navigation URLs
  const externalMapsUrl = isDirections
    ? `https://www.google.com/maps/dir/?api=1&origin=${isFromCurrentLocation ? '' : encodeURIComponent(cleanOrigin)}&destination=${encodeURIComponent(cleanDest)}&travelmode=${travelMode}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDest)}`;

  // Swap Origin and Destination
  const handleSwapLocations = (e) => {
    e.stopPropagation();
    if (!isDirections) return;
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
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
      ? `Route: ${cleanOrigin} to ${cleanDest} (${travelMode})`
      : cleanDest;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`relative group my-4 rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[var(--bg-surface)] shadow-xl backdrop-blur-xl transition-all ${
        isFullscreen ? 'fixed inset-3 sm:inset-8 z-[99999] my-0 flex flex-col shadow-2xl' : 'w-full max-w-2xl'
      }`}>
        {/* Top Header Bar */}
        <div className="flex flex-col gap-2 p-3 sm:p-4 bg-zinc-100/90 dark:bg-white/[0.03] border-b border-zinc-200/80 dark:border-white/5 select-none">
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
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                    {title || (isDirections ? `${cleanOrigin} ➔ ${cleanDest}` : cleanDest)}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] font-bold">
                    {isDirections ? 'Live Route' : 'Live Map'}
                  </span>
                  {isDirections && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
                      Shortest Path
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {isDirections 
                    ? `Interactive Trip Directions & Navigation • ${travelMode.toUpperCase()}`
                    : 'Interactive Google Maps Embed • Street & Satellite'}
                </p>
              </div>
            </div>

            {/* Quick Controls: Satellite & Zoom & Fullscreen */}
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

              {/* Fullscreen Modal Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
              >
                {isFullscreen ? <RiFullscreenExitLine size={15} /> : <RiFullscreenLine size={15} />}
              </button>
            </div>
          </div>

          {/* Directions Cockpit Row (if directions mode) */}
          {isDirections && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5">
              {/* Origin -> Destination Pill with Swap */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 flex-1 min-w-[220px]">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[11px] shrink-0">From:</span>
                <span className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 font-medium truncate max-w-[120px] sm:max-w-[150px]">
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
                <span className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 font-bold text-[var(--accent-cyan)] truncate max-w-[120px] sm:max-w-[150px]">
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
        </div>

        {/* Interactive Google Maps Viewport */}
        <div className={`relative w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden ${
          isFullscreen ? 'flex-1 min-h-[440px]' : 'h-64 sm:h-84'
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
            key={`${cleanOrigin}-${cleanDest}-${travelMode}-${viewType}-${zoom}`}
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
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-white/5 text-xs">
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

      {/* Dimmed backdrop when fullscreen */}
      {isFullscreen && (
        <div 
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99990] animate-in fade-in duration-200"
        />
      )}
    </>
  );
};

export default EmbeddedMapCard;
