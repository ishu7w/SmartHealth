import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
await page.goto("http://localhost:4173");
await page.getByText("Online", { exact: true }).waitFor();
await page.goto("http://localhost:4173/analysis");
await page.getByRole("button", { name: "Use sample data" }).click();
await page.getByRole("button", { name: "Analyze Health", exact: true }).click();
await page
  .getByRole("heading", { name: "Analysis for Demo Patient" })
  .waitFor();
await page.goto("http://localhost:4173/parallel");
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByRole("heading", { name: "Execution time · lower is faster" })
  .waitFor();
await page.route("**/api/analyze/compare", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: '{"sequential": {"tasks": []}}',
  }),
);
await page.getByRole("button", { name: "Run Comparison", exact: true }).click();
await page
  .getByText("The server returned an unexpected response. Please retry.")
  .waitFor();
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "Production bundle: API/CORS, analysis, comparison, malformed-response handling passed; no console errors.",
);
await browser.close();
