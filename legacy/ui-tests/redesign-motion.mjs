import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) errors.push(m.text());
});
const assert = (x, m) => {
  if (!x) throw Error(m);
};
await page.goto("http://localhost:5173");
for (const name of ["SpO₂", "Temperature", "Heart Rate", "SpO₂"])
  await page.getByRole("button", { name, exact: true }).click();
await page.waitForTimeout(500);
const aligned = await page.evaluate(() => {
  const a = document
      .querySelector(".segmented [aria-pressed=true]")
      .getBoundingClientRect(),
    b = document.querySelector(".segment-indicator").getBoundingClientRect();
  return Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1;
});
assert(aligned, "Segment indicator lost alignment");
await page.locator(".compute-feature").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
await page.screenshot({
  path: "../.impeccable/observe-screenshots/dashboard-1440.png",
  fullPage: true,
});
for (const label of [
  "Patient Analysis",
  "Health Monitoring",
  "Parallel Processing",
  "About Project",
])
  await page.getByRole("link", { name: label, exact: true }).click();
await page
  .getByRole("link", { name: "Parallel Processing", exact: true })
  .click();
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByRole("heading", { name: "Execution time · lower is faster" })
  .waitFor();
await page.getByRole("button", { name: "Replay measured run" }).click();
await page.getByRole("button", { name: "Restart replay" }).click();
await page.getByRole("button", { name: "Replay measured run" }).waitFor();
assert(
  (await page.getByText("Completed", { exact: true }).count()) === 5,
  "Restarted replay did not settle",
);
await page.setViewportSize({ width: 375, height: 812 });
for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "Close navigation", exact: true })
    .click();
}
await page.getByRole("button", { name: "Open navigation" }).click();
await page.keyboard.press("Escape");
assert(
  (await page
    .getByRole("button", { name: "Open navigation" })
    .getAttribute("aria-expanded")) === "false",
  "Escape did not dismiss menu",
);
await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });
await page.goto("http://localhost:5173");
await page.getByRole("heading", { name: "Health, in focus." }).waitFor();
await page.getByRole("button", { name: "Temperature", exact: true }).click();
assert(
  (await page
    .getByRole("button", { name: "Temperature", exact: true })
    .getAttribute("aria-pressed")) === "true",
  "Reduced motion control failed",
);
await page.goto("http://localhost:5173/missing");
await page.getByRole("heading", { name: "Page not found." }).waitFor();
assert(errors.length === 0, errors.join("\n"));
await fs.writeFile(
  "../.impeccable/observe-motion-report.json",
  JSON.stringify(
    {
      passed: true,
      checks: [
        "rapid segmented selection alignment",
        "rapid route changes",
        "diagram viewport reveal",
        "interrupt/restart measured replay",
        "mobile menu reversal",
        "Escape dismissal",
        "reduced motion/increased contrast",
        "404 fallback",
      ],
      consoleIssues: errors,
    },
    null,
    2,
  ),
);
console.log("Redesign motion checks passed.");
await browser.close();
