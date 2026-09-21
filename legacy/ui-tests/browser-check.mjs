import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const issues = [];
page.on("pageerror", (e) => issues.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning")
    issues.push(`${msg.type()}: ${msg.text()}`);
});
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const out = "../.impeccable/observe-screenshots";
await fs.mkdir(out, { recursive: true });
await page.goto("http://localhost:5173/");
await page.getByRole("heading", { name: "Health, in focus." }).waitFor();
await page.getByText("Online", { exact: true }).waitFor();
await page.getByRole("button", { name: "SpO₂", exact: true }).click();
check(
  (await page
    .getByRole("button", { name: "SpO₂", exact: true })
    .getAttribute("aria-pressed")) === "true",
  "Chart tab failed",
);
await page.goto("http://localhost:5173/analysis");
await page.getByRole("button", { name: "Use sample data" }).click();
await page.getByLabel("Full name").fill("Browser QA Patient");
await page.getByRole("button", { name: "Analyze Health", exact: true }).click();
await page
  .getByRole("heading", { name: "Analysis for Browser QA Patient" })
  .waitFor();
await page.getByRole("button", { name: "Save Analysis", exact: true }).click();
await page.getByRole("button", { name: "Analysis saved" }).waitFor();
await page
  .getByRole("button", {
    name: /BQ Browser QA Patient|Browser QA Patient.*100/,
  })
  .first()
  .click();
await page
  .getByRole("heading", { name: /Browser QA Patient · Saved analysis/ })
  .waitFor();
await page.getByRole("button", { name: "Close record details" }).click();
await page.goto("http://localhost:5173/parallel");
await page.getByRole("button", { name: "Run Sequential Analysis" }).click();
await page
  .getByRole("button", { name: "Replay measured run" })
  .waitFor({ state: "visible" });
await page.waitForFunction(
  () => !document.querySelector(".demo-controls button").disabled,
);
await page.getByRole("button", { name: "Run Parallel Analysis" }).click();
await page.waitForFunction(
  () => !document.querySelector(".demo-controls button").disabled,
);
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByRole("heading", { name: "Execution time · lower is faster" })
  .waitFor();
await page.getByRole("button", { name: "Replay measured run" }).click();
await page.getByRole("button", { name: "Replay measured run" }).waitFor();
await page.evaluate(() => {
  document.activeElement?.blur();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
await page.screenshot({
  path: `${out}/parallel-results-1440.png`,
  fullPage: true,
});
await page.goto("http://localhost:5173/monitoring");
const first = await page.getByTestId("latest-reading").textContent();
await page.waitForTimeout(3300);
check(
  (await page.getByTestId("latest-reading").textContent()) !== first,
  "Monitoring did not update",
);
await page.getByRole("button", { name: "Pause simulation" }).click();
const paused = await page.getByTestId("latest-reading").textContent();
await page.waitForTimeout(3200);
check(
  (await page.getByTestId("latest-reading").textContent()) === paused,
  "Pause failed",
);
await page.getByRole("button", { name: "Resume simulation" }).click();
for (const width of [375, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of [
    "/",
    "/analysis",
    "/monitoring",
    "/parallel",
    "/about",
  ]) {
    await page.goto("http://localhost:5173" + route);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    check(
      dimensions.scroll <= dimensions.client,
      `Overflow at ${width} ${route}: ${JSON.stringify(dimensions)}`,
    );
    await page.screenshot({
      path: `${out}/${route.slice(1) || "dashboard"}-${width}.png`,
      fullPage: true,
    });
  }
}
await page.setViewportSize({ width: 375, height: 812 });
await page.getByRole("button", { name: "Open navigation" }).click();
await page.getByRole("link", { name: "Patient Analysis", exact: true }).click();
check(page.url().endsWith("/analysis"), "Mobile navigation failed");
await page.route("**/api/analyze", (route) => route.abort());
await page.getByRole("button", { name: "Use sample data" }).click();
await page.getByRole("button", { name: "Analyze Health", exact: true }).click();
await page
  .getByText(/Unable to connect to the healthcare analysis server/)
  .waitFor();
await page.unroute("**/api/analyze");
await page.getByRole("button", { name: "Retry", exact: true }).click();
await page
  .getByRole("heading", { name: "Analysis for Demo Patient" })
  .waitFor();
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://localhost:5173/parallel");
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByRole("heading", { name: "Execution time · lower is faster" })
  .waitFor();
await page.getByRole("button", { name: "Replay measured run" }).click();
check(
  (await page.getByText("Completed", { exact: true }).count()) === 5,
  "Reduced motion replay failed",
);
const unexpected = issues.filter((message) => !message.includes("ERR_FAILED"));
await fs.writeFile(
  "../.impeccable/observe-browser-report.json",
  JSON.stringify(
    {
      passed: !unexpected.length,
      consoleIssues: unexpected,
      checks: [
        "all pages at 375/768/1024/1440",
        "analyze/save/history/detail",
        "sequential/parallel/comparison/replay",
        "monitor update/pause/resume",
        "mobile nav",
        "offline retry",
        "reduced motion",
      ],
    },
    null,
    2,
  ),
);
check(!unexpected.length, "Console issues: " + unexpected.join("\n"));
console.log(
  "Browser checks passed; screenshots saved at .impeccable/observe-screenshots",
);
await browser.close();
