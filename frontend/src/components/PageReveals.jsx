import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap, reduceMotion } from "../lib/motion";

// A bounded, once-per-section reveal. Content remains visible without JavaScript.
export default function PageReveals() {
  const { pathname } = useLocation();
  const effects = useRef([]);
  useEffect(() => {
    const nodes = [
      ...document.querySelectorAll(
        "main .overview-surface, main .compute-feature, main .analysis-workspace, main .history, main .simulation-banner, main .monitoring-vitals, main .monitor-charts > section, main .processing-workspace, main .comparison-section, main .core-panel, main .about-story, main .workflow-section, main .about-details, main .concept-grid",
      ),
    ];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (!reduceMotion()) {
            effects.current.push(
              gsap.fromTo(
                entry.target,
                { y: 14, opacity: 0.65 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "settle",
                  clearProps: "transform,opacity",
                },
              ),
            );
            const details = entry.target.querySelectorAll(
              ".vital-card, .workflow-step, .concept-grid > div, .tech-list > div",
            );
            if (details.length)
              effects.current.push(
                gsap.fromTo(
                  details,
                  { opacity: 0.55, y: 8 },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.65,
                    stagger: { each: 0.065, amount: 0.3 },
                    ease: "settle",
                    clearProps: "transform,opacity",
                  },
                ),
              );
          }
        }),
      { threshold: 0.06 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      effects.current.forEach((effect) => effect.revert());
      effects.current = [];
    };
  }, [pathname]);
  return null;
}
