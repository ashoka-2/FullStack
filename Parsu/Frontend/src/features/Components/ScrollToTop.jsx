import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLenis } from "lenis/react";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Preserve scroll position if navigating to an in-page hash anchor
    if (hash) return;

    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, lenis]);

  return null;
};

export default ScrollToTop;

