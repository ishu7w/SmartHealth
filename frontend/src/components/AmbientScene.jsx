import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { gsap } from "../lib/motion";

export default function AmbientScene() {
  const artwork = useRef(null);
  const drift = useRef(null);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    // Keep the original scene steady. Only a centered 2.5% zoom changes over 50 seconds.
    drift.current = gsap.fromTo(
      artwork.current,
      { scale: 1 },
      {
        scale: 1.025,
        duration: 50,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        force3D: true,
        paused: true,
        data: "ambient",
      },
    );
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setPaused(media.matches);
    media.addEventListener("change", changed);
    return () => {
      media.removeEventListener("change", changed);
      drift.current?.revert();
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "reduced" : "full";
    if (paused) {
      gsap.globalTimeline.getChildren(true, true, false).forEach((tween) => {
        if (tween.data === "ambient") return;
        tween.progress(1);
        tween.kill();
      });
    }
    window.dispatchEvent(new Event("motion-preference-change"));
    const synchronize = () => {
      if (paused || document.hidden) drift.current?.pause();
      else drift.current?.resume();
    };
    synchronize();
    document.addEventListener("visibilitychange", synchronize);
    return () => document.removeEventListener("visibilitychange", synchronize);
  }, [paused]);
  return (
    <>
      <div className="ambient-scene" aria-hidden="true">
        <img
          ref={artwork}
          className="ambient-artwork"
          src="/media/observe-still.jpg"
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={() => setUnavailable(true)}
        />
      </div>
      <button
        className="motion-toggle liquid-glass"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? "Enable site motion" : "Pause site motion"}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
        <span>{paused ? "Motion paused" : "Pause motion"}</span>
      </button>
      {unavailable && (
        <span className="video-fallback-note" role="status">
          Background unavailable. All tools remain available.
        </span>
      )}
    </>
  );
}
