import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(CustomEase, Flip, DrawSVGPlugin, SplitText);
CustomEase.create("settle", "0.22, 0.8, 0.25, 1");
export const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.dataset.motion === "reduced";
export { gsap, Flip, DrawSVGPlugin, SplitText };
