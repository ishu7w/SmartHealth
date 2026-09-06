# SmartHealth · Observe glass

The current direction follows the user's Observe reference: a black canvas, monochrome interface, liquid glass materials, Instrument Serif headlines with italic emphasis, and dimmed full-screen artwork. It supersedes the earlier porcelain design. SmartHealth retains all five functional project pages.

## Material and type

The original scene is preserved as a locally bundled still image. GSAP gently scales it from 1 to 1.025 over 50 seconds, then returns with sine easing. It never translates or rotates, and no video decoder or frame cadence is involved. A static 55% black overlay keeps the background quiet. Working surfaces use 94% opaque charcoal and fine masked rims without backdrop blur. Navigation is 97% opaque. Text shadows have been removed for crisp edges. These changes respond to the user’s reported readability and playback problems.

Headlines use locally bundled Instrument Serif regular and italic. Body text, controls, labels, and measurements use the platform sans-serif stack. Reading text is 16px, primary labels 15–16px, and supporting labels generally at least 14px; compact mobile chart and diagram labels are 13px. Controls and plots are grayscale; the artwork supplies all color. Status labels remain explicit, with additional underline treatment for warnings and critical states. Focus rings are white.

## Layout

The centered content column is 1160px, growing to 1240px on large displays. Floating capsule navigation becomes an expandable mobile menu below 768px. Hero headings are centered with generous space around them.

Overview groups four vitals in one continuous surface. Analysis pairs a desktop inspector with a focused form. Monitoring presents one primary and two supporting charts. Processing brings sample inputs and measured execution lanes together, followed by comparison and worker replay. About uses editorial sections and a six-step workflow. Layouts have been checked from 320px through 1440px, with full screenshots at 375, 768, 1024, and 1440px.

## Motion

- GSAP SplitText introduces headline words with a short stagger and restores markup on route cleanup.
- CustomEase powers interruptible navigation and segmented selection, plus section entrances.
- IntersectionObserver reveals major sections once per visit, using opacity and translation only.
- DrawSVG traces the conceptual worker diagrams; Flip animates saved-record expansion.
- Values interpolate to their current readings, and the worker replay uses measured backend timestamps.
- Lenis uses a 1.05-second response driven by the shared GSAP ticker; native touch scrolling remains enabled, and subscriptions are removed on cleanup.
- The fixed Pause motion control pauses the background and visual transitions across route changes. The background tween also pauses when the document is hidden.
- OS reduced motion bypasses movement, smooth scrolling, number interpolation, and autoplay. All content and actions remain available.

## Scope

Preserve sample labels, simulated monitoring notices, educational rules, saved history, measured timing, and explanations of thread concurrency. The visual replay is not CPU telemetry. Avoid adding invented performance claims or clinical functionality.

The background is served from `frontend/public/media/observe-still.jpg`, extracted from the original supplied film. The film is retained as a source asset but is not loaded by the app. If the image is unavailable, the black canvas and functioning tools remain, with a brief status notice. Fonts are included in the build.

Sections also stagger their vital, workflow, and technology rows once on viewport entry. Button icons glide 3px on hover; reduced motion suppresses these transitions. See `.impeccable/steady-motion-report.json` for stationary-transform and pause/resume checks.
