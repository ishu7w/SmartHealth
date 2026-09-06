import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { gsap, reduceMotion } from "../lib/motion";
export default function SmoothScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis;
    const tick = (time) => lenis?.raf(time * 1000);
    const cleanup = () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = undefined;
    };
    const setup = () => {
      cleanup();
      if (reduceMotion()) return;
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      });
      gsap.ticker.add(tick);
    };
    setup();
    media.addEventListener("change", setup);
    window.addEventListener("motion-preference-change", setup);
    return () => {
      cleanup();
      media.removeEventListener("change", setup);
      window.removeEventListener("motion-preference-change", setup);
    };
  }, [pathname]);
  return null;
}
