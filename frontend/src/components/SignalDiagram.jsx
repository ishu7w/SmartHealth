import { useEffect, useRef } from "react";
import { gsap, reduceMotion } from "../lib/motion";
const names = ["Heart rate", "Blood pressure", "Oxygen", "Temp.", "Glucose"];
export default function SignalDiagram() {
  const root = useRef(null);
  useEffect(() => {
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {}, root);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (!reduceMotion())
          ctx.add(() =>
            gsap.fromTo(
              ".signal-wire",
              { drawSVG: "0%" },
              {
                drawSVG: "100%",
                duration: 0.9,
                stagger: 0.045,
                ease: "settle",
              },
            ),
          );
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, []);
  return (
    <div
      className="signal-diagram"
      ref={root}
      role="img"
      aria-label="Conceptual diagram: patient input fans out to five independent health checks, which combine into one result"
    >
      <div className="signal-source">Patient input</div>
      <div className="signal-branches">
        <svg viewBox="0 0 500 38" preserveAspectRatio="none" aria-hidden="true">
          {[50, 150, 250, 350, 450].map((x) => (
            <path
              key={x}
              className="signal-wire"
              d={`M250 0V16Q250 20 ${x} 20V38`}
              fill="none"
              stroke="#a3a3a3"
              strokeWidth="1"
            />
          ))}
        </svg>
        <div className="signal-nodes">
          {names.map((name, i) => (
            <div key={name}>
              <span>
                <i />
                <i />
                <i />
                <i />
                <b>{String(i + 1).padStart(2, "0")}</b>
              </span>
              <small>{name}</small>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 500 38" preserveAspectRatio="none" aria-hidden="true">
          {[50, 150, 250, 350, 450].map((x) => (
            <path
              key={x}
              className="signal-wire"
              d={`M${x} 0V18H250V38`}
              fill="none"
              stroke="#a3a3a3"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      <div className="signal-output">
        <span className="status-dot" />
        Combined result
      </div>
      <p>5 independent tasks · 5 worker threads</p>
    </div>
  );
}
