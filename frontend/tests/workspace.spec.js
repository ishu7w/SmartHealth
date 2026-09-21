import { test, expect } from "@playwright/test";
const password = "browser-test-password-123";
test("patient, doctor, and administrator workflows remain usable across screen sizes", async ({
  browser,
}) => {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const suffix = Date.now();
  const patientEmail = `patient-${suffix}@example.test`,
    doctorEmail = `doctor-${suffix}@example.test`;
  await page.goto("/");
  await page
    .getByRole("button", { name: "New patient? Create an account" })
    .click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Patient");
  await page.getByLabel("Email address").fill(patientEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Health, in focus." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "My profile", exact: true }).click();
  await page.getByRole("button", { name: "Add patient", exact: true }).click();
  await page.getByLabel("Age", { exact: true }).fill("28");
  await page.getByLabel("Gender", { exact: true }).selectOption("Female");
  await page.getByLabel("Blood group", { exact: true }).selectOption("O+");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Browser Test Patient", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add reading", exact: true }).click();
  await page.getByLabel("Oxygen saturation (%)").fill("88");
  await page.getByRole("button", { name: "Analyze & save reading" }).click();
  await expect(
    page.getByRole("heading", { name: "Educational risk score" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "76",
  );
  await page.getByRole("link", { name: "Alerts", exact: true }).first().click();
  await expect(
    page.getByText("Low oxygen level", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Acknowledge", exact: true }),
  ).toHaveCount(0);
  await page.goto("/monitoring");
  await page.getByLabel("Simulation scenario").selectOption("critical");
  await page.getByRole("button", { name: "Start simulation" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await page.goto("/parallel");
  await expect(
    page.getByRole("heading", { name: "Staff workspace." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByLabel("Email address")
    .fill(process.env.E2E_ADMIN_EMAIL || "admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.E2E_ADMIN_PASSWORD || "local-test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Doctors", exact: true }).click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Doctor");
  await page.getByLabel("Email address").fill(doctorEmail);
  await page.getByLabel("Initial password").fill(password);
  await page.getByRole("button", { name: "Create doctor" }).click();
  await expect(
    page.locator(".directory-row").filter({ hasText: doctorEmail }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Email address").fill(doctorEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Alerts", exact: true }).first().click();
  await page
    .getByRole("button", { name: "Acknowledge", exact: true })
    .first()
    .click();
  await expect(
    page
      .locator(".alert-row")
      .getByText("Acknowledged", { exact: true })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resolve", exact: true })
    .first()
    .click();
  await page.goto("/parallel");
  await page.getByLabel("Patient records", { exact: true }).selectOption("100");
  await page.getByLabel("Worker threads", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Compare both modes" }).click();
  await expect(
    page.getByRole("heading", { name: "Measured results" }),
  ).toBeVisible();
  await expect(
    page.getByText("Full 64-bit result checksums matched on the server.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator(".task-row")).toHaveCount(100);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/patients",
      "/analysis",
      "/monitoring",
      "/alerts",
      "/parallel",
      "/about",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".loading")).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `Horizontal overflow at ${width}px ${route}`).toBe(
        false,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/patients");
  await page.screenshot({
    path: "test-results/patients-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await context.close();
});

test("existing motion and navigation work without reduced-motion mode", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "Healthcare meets computing." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause site motion", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.setViewportSize({ width: 375, height: 850 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Patient Analysis" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your health workspace." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(errors).toEqual([]);
});
