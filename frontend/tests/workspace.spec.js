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
  await page.goto("/care");
  await page.getByRole("button", { name: "Edit care notes" }).click();
  await page
    .getByLabel("Allergies and reactions", { exact: true })
    .fill("Synthetic latex reaction");
  await page
    .getByLabel("Conditions and health history", { exact: true })
    .fill("Synthetic demonstration");
  await page
    .getByLabel("Care notes and questions", { exact: true })
    .fill("Ask about recent readings");
  await page.getByRole("button", { name: "Save care notes" }).click();
  await expect(
    page.getByText("Synthetic latex reaction", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Add a medication to your list", { exact: true })
    .click();
  await page
    .getByLabel("Medication name", { exact: true })
    .fill("Demo medication");
  await page
    .getByLabel("Dose as instructed", { exact: true })
    .fill("Example instructions");
  await page
    .getByLabel("Schedule as instructed", { exact: true })
    .fill("Morning");
  await page.getByRole("button", { name: "Save medication" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo medication" }),
  ).toBeVisible();
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download readings CSV" }).click();
  const csv = await csvPromise;
  expect(csv.suggestedFilename()).toMatch(/readings.csv$/);
  await page.goto("/parallel");
  await expect(
    page.getByRole("heading", { name: "Staff workspace." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
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
    .fill(`Browser Test Doctor ${suffix}`);
  await page.getByLabel("Email address").fill(doctorEmail);
  await page.getByLabel("Initial password").fill(password);
  await page.getByRole("button", { name: "Create doctor" }).click();
  await expect(
    page.locator(".directory-row").filter({ hasText: doctorEmail }),
  ).toBeVisible();
  await page.goto("/appointments");
  const nextDay = new Date(Date.now() + 86400000);
  nextDay.setHours(10, 0, 0, 0);
  const localDate = new Date(
    nextDay.getTime() - nextDay.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await page
    .getByLabel("Doctor", { exact: true })
    .selectOption({ label: `Browser Test Doctor ${suffix}` });
  await page.getByLabel(/Preferred date and time/).fill(localDate);
  await page
    .getByLabel("Reason for visit", { exact: true })
    .fill(`Follow-up ${suffix}`);
  await page
    .getByRole("button", { name: "Request appointment", exact: true })
    .click();
  await expect(
    page.getByText(`Follow-up ${suffix}`, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel("Email address").fill(doctorEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Workspace navigation" }),
  ).toBeVisible();
  await page.goto("/appointments");
  const visit = page
    .locator(".appointment-card")
    .filter({ hasText: `Follow-up ${suffix}` });
  await visit
    .getByLabel(/Staff notes for appointment/)
    .fill("Demo call instructions");
  await visit.getByRole("button", { name: "Confirm request" }).click();
  await expect(visit.getByText("Confirmed", { exact: true })).toBeVisible();
  const calendarPromise = page.waitForEvent("download");
  await visit.getByRole("button", { name: "Add to calendar" }).click();
  expect((await calendarPromise).suggestedFilename()).toMatch(/\.ics$/);
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
      "/care",
      "/appointments",
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
  await page.goto("/care");
  await expect(
    page.getByRole("heading", { name: "Medication list" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/care-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/appointments");
  await expect(
    page.getByRole("heading", { name: "Your appointment timeline" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/appointments-desktop.png",
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
  await page
    .getByRole("button", { name: "Pause site motion", exact: true })
    .click();
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
