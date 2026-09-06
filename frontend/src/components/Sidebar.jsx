import { useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  ClipboardPlus,
  Activity,
  Cpu,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { gsap, reduceMotion } from "../lib/motion";
export const navigation = [
  ["/", "Dashboard", LayoutDashboard],
  ["/analysis", "Patient Analysis", ClipboardPlus],
  ["/monitoring", "Health Monitoring", Activity],
  ["/parallel", "Parallel Processing", Cpu],
  ["/about", "About Project", BookOpen],
];
const shortNames = [
  "Overview",
  "Analysis",
  "Monitoring",
  "Processing",
  "About",
];
export default function Sidebar({ open, close, toggle }) {
  const { pathname } = useLocation();
  const bar = useRef(null),
    marker = useRef(null),
    drawer = useRef(null);
  useLayoutEffect(() => {
    const move = () => {
      const active = bar.current?.querySelector(".active");
      if (active)
        gsap.to(marker.current, {
          x: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
          duration: reduceMotion() ? 0 : 0.4,
          ease: "settle",
          overwrite: true,
        });
    };
    move();
    const resize = new ResizeObserver(move);
    resize.observe(bar.current);
    return () => {
      resize.disconnect();
      gsap.killTweensOf(marker.current);
    };
  }, [pathname]);
  useLayoutEffect(() => {
    gsap.to(drawer.current, {
      height: open ? "auto" : 0,
      opacity: open ? 1 : 0,
      duration: reduceMotion() ? 0 : 0.35,
      ease: "settle",
      overwrite: true,
    });
  }, [open]);
  return (
    <header className={`app-chrome ${open ? "menu-open" : ""}`}>
      <div className="navigation-shell">
        <NavLink
          to="/"
          className="brand"
          onClick={close}
          aria-label="SmartHealth overview"
        >
          <span className="brand-icon">
            <HeartPulse size={23} strokeWidth={1.8} />
          </span>
          <span>
            SmartHealth<span className="brand-mark">.</span>
          </span>
        </NavLink>
        <nav
          ref={bar}
          className="desktop-navigation"
          aria-label="Main navigation"
        >
          <span ref={marker} className="nav-indicator" aria-hidden="true" />
          {navigation.map(([path, label], i) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              aria-label={label}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>{shortNames[i]}</span>
            </NavLink>
          ))}
        </nav>
        <span className="chrome-edition">Academic edition</span>
        <button
          className="menu-button icon-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={toggle}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <div
        ref={drawer}
        className="mobile-drawer"
        id="mobile-navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Mobile navigation">
          {navigation.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"} onClick={close}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p>Integrated Healthcare Computing</p>
      </div>
    </header>
  );
}
