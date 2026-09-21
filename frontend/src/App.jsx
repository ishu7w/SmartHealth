import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import AmbientScene from "./components/AmbientScene";
import PageReveals from "./components/PageReveals";
import Sidebar, { navigation } from "./components/Sidebar";
import SmoothScroll from "./components/SmoothScroll";
import { gsap, reduceMotion, SplitText } from "./lib/motion";
import Dashboard from "./pages/Dashboard";
import PatientAnalysis from "./pages/PatientAnalysis";
import Monitoring from "./pages/Monitoring";
import ParallelDemo from "./pages/ParallelDemo";
import About from "./pages/About";
import Account from "./pages/Account";
import Patients from "./pages/Patients";
import Alerts from "./pages/Alerts";
import Doctors from "./pages/Doctors";
import { AccountBar, RequireAccount } from "./components/Session";
export default function App() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const main = useRef(null);
  const page =
    navigation.find(([path]) => path === pathname)?.[1] ||
    {
      "/patients": "Patients",
      "/alerts": "Alerts",
      "/doctors": "Doctors",
      "/account": "Account",
    }[pathname] ||
    "Page not found";
  useEffect(() => {
    document.title = `${page} · SmartHealth`;
    setOpen(false);
  }, [page]);
  useEffect(() => {
    if (!open) return;
    const listener = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        document.querySelector(".menu-button")?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open]);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduceMotion()) return;
      const heading = main.current.querySelector("h1");
      if (heading)
        SplitText.create(heading, {
          type: "words",
          aria: "auto",
          onSplit(self) {
            return gsap.fromTo(
              self.words,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.85,
                stagger: 0.065,
                ease: "settle",
                clearProps: "transform,opacity",
              },
            );
          },
        });
      gsap.fromTo(
        main.current.querySelector(".page-stack") ||
          main.current.firstElementChild,
        { opacity: 0.6 },
        { opacity: 1, duration: 0.35, clearProps: "opacity" },
      );
    }, main);
    return () => ctx.revert();
  }, [pathname]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AmbientScene />
      <SmoothScroll />
      <PageReveals />
      <Sidebar
        open={open}
        close={() => setOpen(false)}
        toggle={() => setOpen((value) => !value)}
      />
      <main ref={main} id="main-content" tabIndex={-1}>
        <AccountBar />
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route element={<RequireAccount />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<PatientAnalysis />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>
          <Route element={<RequireAccount staff />}>
            <Route path="/parallel" element={<ParallelDemo />} />
          </Route>
          <Route element={<RequireAccount admin />}>
            <Route path="/doctors" element={<Doctors />} />
          </Route>
          <Route path="/about" element={<About />} />
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>Page not found.</h1>
                <p>This page is not part of the SmartHealth workspace.</p>
                <Link className="button" to="/">
                  Back to overview
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>
        <div>
          <strong>SmartHealth.</strong>
          <span>Healthcare meets computing.</span>
        </div>
        <p>Educational prototype. Not for clinical use.</p>
        <Link to="/about">
          About the project <ArrowUpRight size={14} />
        </Link>
      </footer>
    </>
  );
}
