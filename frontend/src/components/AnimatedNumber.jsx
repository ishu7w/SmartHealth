import { useEffect, useRef } from "react";
import { gsap, reduceMotion } from "../lib/motion";
export default function AnimatedNumber({ value, decimals = 0 }) {
  const node = useRef(null),
    current = useRef({ value: Number(value) });
  useEffect(() => {
    if (!Number.isFinite(Number(value))) return;
    const tween = gsap.to(current.current, {
      value: Number(value),
      duration: reduceMotion() ? 0 : 0.65,
      ease: "settle",
      overwrite: true,
      onUpdate: () => {
        if (node.current)
          node.current.textContent = current.current.value.toFixed(decimals);
      },
    });
    return () => tween.kill();
  }, [value, decimals]);
  return (
    <span ref={node} aria-label={String(value)}>
      {Number(value).toFixed(decimals)}
    </span>
  );
}
