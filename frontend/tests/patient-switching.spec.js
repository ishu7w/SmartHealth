import { test, expect } from "@playwright/test";

async function workspace(page, denied = false) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (denied && path === "/api/appointments") {
      return route.fulfill({ status: 403, json: {} });
    }
    const data =
      path === "/api/auth/me"
        ? { id: 3, role: "DOCTOR", name: "Test doctor" }
        : path === "/api/patients"
          ? [
              { id: 1, patientId: "P-1", name: "Alice", userId: 1 },
              { id: 2, patientId: "P-2", name: "Bob", userId: 2 },
            ]
          : path === "/api/portal/config"
            ? { practiceTools: false }
            : path === "/api/care/doctors"
              ? [{ id: 3, name: "Test doctor" }]
              : [];
    await route.fulfill({ json: data });
  });
}

test("switching the measurement patient clears the previous patient's readings", async ({
  page,
}) => {
  await workspace(page);
  await page.goto("/analysis");
  const patient = page.getByLabel("Patient", { exact: true });
  await expect(patient).toHaveValue("1");
  await page.getByLabel("Heart rate (bpm)", { exact: true }).fill("75");
  await patient.selectOption("2");
  await expect(
    page.getByLabel("Heart rate (bpm)", { exact: true }),
  ).toHaveValue("");
});

test("switching the task patient clears the previous patient's draft", async ({
  page,
}) => {
  await workspace(page);
  await page.goto("/tasks");
  await page.getByLabel("Task title").fill("Alice follow-up");
  await page
    .getByLabel("Instructions or notes")
    .fill("Alice's private instructions");
  await page.getByLabel("Due date", { exact: true }).fill("2027-01-01");
  await page.getByLabel("Task patient").selectOption("2");
  await expect(page.getByLabel("Task title")).toHaveValue("");
  await expect(page.getByLabel("Instructions or notes")).toHaveValue("");
  await expect(page.getByLabel("Due date", { exact: true })).toHaveValue("");
});

test("permission errors are not reported as a server connection failure", async ({
  page,
}) => {
  await workspace(page, true);
  await page.goto("/appointments");
  await expect(
    page.getByText("You do not have permission to perform this action."),
  ).toBeVisible();
});
