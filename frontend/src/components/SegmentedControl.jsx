import { useLayoutEffect, useRef } from "react";
import { gsap, reduceMotion } from "../lib/motion";
export default function SegmentedControl({ options, value, onChange, label }) {
  const root = useRef(null),
    indicator = useRef(null);
  useLayoutEffect(() => {
    const update = () => {
      const active = root.current?.querySelector('[aria-pressed="true"]');
      if (!active) return;
      gsap.to(indicator.current, {
        x: active.offsetLeft,
        width: active.offsetWidth,
        duration: reduceMotion() ? 0 : 0.35,
        ease: "settle",
        overwrite: true,
      });
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(root.current);
    return () => {
      resize.disconnect();
      gsap.killTweensOf(indicator.current);
    };
  }, [value]);
  return (
    <div className="segmented" ref={root} role="group" aria-label={label}>
      <span ref={indicator} className="segment-indicator" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
