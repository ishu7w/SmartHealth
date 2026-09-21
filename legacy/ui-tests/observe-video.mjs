import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const assert = (v, m) => {
  if (!v) throw Error(m);
};
await page.goto("http://localhost:5173/");
await page.waitForFunction(
  () => document.querySelector(".ambient-artwork")?.naturalWidth > 0,
);
assert(
  (await page.locator("video").count()) === 0,
  "Video decoder still active",
);
const measurement = await page.evaluate(async () => {
  const el = document.querySelector(".ambient-artwork");
  const samples = [];
  const frames = [];
  let last = performance.now();
  await new Promise((resolve) => {
    const end = last + 3500;
    const tick = (t) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      samples.push([m.a, m.b, m.c, m.d, m.e, m.f]);
      frames.push(t - last);
      last = t;
      if (t < end) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  return {
    first: samples[0],
    last: samples.at(-1),
    stationary: samples.every(
      (m) => m[1] === 0 && m[2] === 0 && m[4] === 0 && m[5] === 0,
    ),
    maxScaleStep: Math.max(
      ...samples.slice(1).map((m, i) => Math.abs(m[0] - samples[i][0])),
    ),
    frames: frames.length,
    longFrames: frames.filter((t) => t > 33.4).length,
  };
});
assert(measurement.stationary, "Scene translates or rotates");
assert(measurement.last[0] > measurement.first[0], "Gentle zoom not running");
assert(measurement.maxScaleStep < 0.001, "Scene jumps");
await page
  .getByRole("button", { name: "Pause site motion", exact: true })
  .click();
const before = await page
  .locator(".ambient-artwork")
  .evaluate((e) => getComputedStyle(e).transform);
await page.waitForTimeout(300);
assert(
  (await page
    .locator(".ambient-artwork")
    .evaluate((e) => getComputedStyle(e).transform)) === before,
  "Pause did not freeze scene",
);
await page
  .getByRole("link", { name: "Parallel Processing", exact: true })
  .click();
assert(
  (await page
    .locator(".ambient-artwork")
    .evaluate((e) => getComputedStyle(e).transform)) === before,
  "Route changed background",
);
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByRole("heading", { name: "Execution time · lower is faster" })
  .waitFor();
await page.getByRole("button", { name: "Replay measured run" }).click();
assert(
  (await page.getByText("Completed", { exact: true }).count()) === 5,
  "Static replay failed",
);
await page
  .getByRole("button", { name: "Enable site motion", exact: true })
  .click();
await page.waitForTimeout(500);
assert(
  (await page
    .locator(".ambient-artwork")
    .evaluate((e) => getComputedStyle(e).transform)) !== before,
  "Resume failed",
);
await page.setViewportSize({ width: 320, height: 740 });
for (const route of ["/", "/analysis", "/monitoring", "/parallel", "/about"]) {
  await page.goto("http://localhost:5173" + route);
  await page.evaluate(() => document.fonts.ready);
  assert(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
    "Overflow " + route,
  );
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://localhost:5173/");
const staticTransform = await page
  .locator(".ambient-artwork")
  .evaluate((e) => getComputedStyle(e).transform);
await page.waitForTimeout(400);
assert(
  (await page
    .locator(".ambient-artwork")
    .evaluate((e) => getComputedStyle(e).transform)) === staticTransform,
  "OS reduced motion failed",
);
assert(!errors.length, errors.join("\n"));
await fs.writeFile(
  "../.impeccable/steady-motion-report.json",
  JSON.stringify(
    {
      passed: true,
      measurement,
      checks: [
        "same artwork; no video decoding",
        "no translation or rotation",
        "slow continuous zoom",
        "pause/resume without reset",
        "background preserved across routes",
        "paused comparison replay",
        "all pages at 320px",
        "OS reduced motion",
      ],
      errors,
    },
    null,
    2,
  ),
);
console.log("Steady background checks passed", measurement);
await browser.close();
