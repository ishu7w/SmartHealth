import { test, expect } from "@playwright/test";

test("patients and doctors exchange private messages and complete follow-up tasks", async ({
  browser,
}) => {
  const errors = [];
  const patient = await browser.newContext({ reducedMotion: "reduce" });
  const staff = await browser.newContext({ reducedMotion: "reduce" });
  const p = await patient.newPage(),
    d = await staff.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  d.on("pageerror", (e) => errors.push(e.message));
  const suffix = Date.now(),
    doctorName = `Care Doctor ${suffix}`,
    patientEmail = `care-patient-${suffix}@example.test`,
    doctorEmail = `care-doctor-${suffix}@example.test`,
    password = "care-workflow-password-123";
  async function signIn(page, email, secret) {
    await page.goto("/account");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(secret);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Health, in focus." }),
    ).toBeVisible();
  }
  await signIn(
    d,
    process.env.E2E_ADMIN_EMAIL || "admin@example.test",
    process.env.E2E_ADMIN_PASSWORD || "local-test-password-123",
  );
  await d.goto("/doctors");
  await d.getByLabel("Full name", { exact: true }).fill(doctorName);
  await d.getByLabel("Email address").fill(doctorEmail);
  await d.getByLabel("Initial password").fill(password);
  await d.getByRole("button", { name: "Create doctor", exact: true }).click();
  await expect(
    d.locator(".directory-row").filter({ hasText: doctorEmail }),
  ).toBeVisible();
  await d.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(d).toHaveURL(/\/account$/);
  await p.goto("/account");
  await p
    .getByRole("button", { name: "New patient? Create an account" })
    .click();
  await p
    .getByLabel("Full name", { exact: true })
    .fill(`Care Patient ${suffix}`);
  await p.getByLabel("Email address").fill(patientEmail);
  await p.getByLabel("Password", { exact: true }).fill(password);
  await p.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: "Health, in focus." }),
  ).toBeVisible();
  await p.goto("/patients");
  await p.getByRole("button", { name: "Add patient", exact: true }).click();
  await p.getByLabel("Age", { exact: true }).fill("30");
  await p.getByLabel("Gender", { exact: true }).selectOption("Other");
  await p.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: `Care Patient ${suffix}`, exact: true }),
  ).toBeVisible();
  await p.goto("/analysis");
  await expect(p.getByLabel("Heart rate (bpm)", { exact: true })).toHaveValue(
    "",
  );
  await p.goto("/tasks");
  await p.getByLabel("Task title").fill(`Bring readings ${suffix}`);
  await p.getByLabel("Due date", { exact: true }).fill("2026-10-06");
  await p
    .getByLabel("Instructions or notes")
    .fill("Write questions for the next visit.");
  await p.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: `Bring readings ${suffix}` }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Mark complete", exact: true }).click();
  await p.getByLabel("Task status").selectOption("Completed");
  await expect(
    p.getByRole("heading", { name: `Bring readings ${suffix}` }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Reopen task", exact: true }).click();
  await p.getByLabel("Task status").selectOption("Open");
  await expect(
    p.getByRole("heading", { name: `Bring readings ${suffix}` }),
  ).toBeVisible();
  await p.goto("/messages");
  await p.getByLabel("Message doctor").selectOption({ label: doctorName });
  await p
    .getByLabel("Subject", { exact: true })
    .fill(`Visit preparation ${suffix}`);
  await p
    .getByLabel("Message", { exact: true })
    .fill("What should I bring to my visit?");
  await p.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(p.locator(".message-bubble")).toContainText(
    "What should I bring to my visit?",
  );
  await signIn(d, doctorEmail, password);
  await d.goto("/messages");
  await expect(d.getByLabel("Unread messages")).toHaveCount(1);
  await d
    .getByRole("button", { name: new RegExp(`Visit preparation ${suffix}`) })
    .click();
  await d
    .getByLabel("Your reply")
    .fill("Please bring your measurement log and questions.");
  await d.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(d.locator(".message-bubble").last()).toContainText(
    "Please bring your measurement log and questions.",
  );
  await p.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(p.locator(".message-bubble").last()).toContainText(
    "Please bring your measurement log and questions.",
  );
  await p.reload();
  await expect(p.locator(".message-bubble")).toHaveCount(2);
  for (const width of [375, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    for (const route of ["/messages", "/tasks", "/"]) {
      await p.goto(route);
      await expect(p.locator("h1")).toBeVisible();
      await expect(p.locator(".loading")).toHaveCount(0);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        `${route} at ${width}`,
      ).toBe(false);
    }
  }
  await p.setViewportSize({ width: 375, height: 850 });
  await p.goto("/messages");
  await p
    .getByRole("button", { name: new RegExp(`Visit preparation ${suffix}`) })
    .click();
  await expect(p.locator(".message-bubble")).toHaveCount(2);
  await p.screenshot({
    path: "test-results/messages-mobile.png",
    fullPage: true,
  });
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.goto("/tasks");
  await p.screenshot({
    path: "test-results/tasks-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await patient.close();
  await staff.close();
});
