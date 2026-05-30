import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to combine debouncing and throttling.
 * - Throttles updates so the search results refresh at most once every `throttleLimit` ms.
 * - Debounces updates so that when typing stops, the final search query is committed after `delay` ms of silence.
 * - Slower, high-performance defaults (800ms) protect against frequent DOM re-evaluations for large lists.
 */
export const useDebounceThrottle = (value, delay = 800, throttleLimit = 800) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const lastRan = useRef(Date.now());
    const handlerRef = useRef(null);

    useEffect(() => {
        const now = Date.now();
        const timeElapsed = now - lastRan.current;

        // Clear any pending debounce timeout
        if (handlerRef.current) {
            clearTimeout(handlerRef.current);
        }

        if (throttleLimit && timeElapsed >= throttleLimit) {
            // Throttle limit met: update the search state immediately
            setDebouncedValue(value);
            lastRan.current = now;
        } else {
            // Debounce: schedule a fallback update for when the user stops typing
            handlerRef.current = setTimeout(() => {
                setDebouncedValue(value);
                lastRan.current = Date.now();
            }, delay);
        }

        return () => {
            if (handlerRef.current) {
                clearTimeout(handlerRef.current);
            }
        };
    }, [value, delay, throttleLimit]);

    return debouncedValue;
};

export default useDebounceThrottle;
