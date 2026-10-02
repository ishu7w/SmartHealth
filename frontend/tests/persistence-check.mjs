import { request } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const mode = process.argv[2],
  path =
    process.env.PERSISTENCE_SNAPSHOT || "/tmp/smarthealth-persistence.json";
assert.ok(["save", "verify"].includes(mode), "Use save or verify");
const client = await request.newContext({
  baseURL: process.env.APP_URL || "http://localhost:8080",
});
try {
  const csrf = await (await client.get("/api/auth/csrf")).json();
  const auth = await client.post("/api/auth/login", {
    form: {
      username: process.env.E2E_ADMIN_EMAIL || "admin@example.test",
      password: process.env.E2E_ADMIN_PASSWORD || "local-test-password-123",
    },
    headers: { [csrf.headerName]: csrf.token },
  });
  assert.equal(auth.status(), 200, "Admin login");
  async function get(path) {
    const response = await client.get(path);
    assert.equal(response.status(), 200, path);
    return response.json();
  }
  const patients = await get("/api/patients");
  assert.ok(patients.length, "At least one test patient must exist");
  const summaries = [];
  for (const p of patients) {
    const s = await get(`/api/patients/${p.id}/summary`);
    delete s.generatedAt;
    if (!s.profile.id) {
      delete s.profile.updatedAt;
      delete s.profile.createdAt;
    }
    summaries.push(s);
  }
  const snapshot = {
    patients,
    summaries,
    alerts: await get("/api/alerts"),
    benchmarks: await get("/api/process/benchmarks"),
  };
  assert.ok(snapshot.benchmarks.length, "Measured benchmarks should persist");
  if (mode === "save")
    await writeFile(path, JSON.stringify(snapshot), { mode: 0o600 });
  else
    assert.deepEqual(
      snapshot,
      JSON.parse(await readFile(path, "utf8")),
      "All saved patient data and benchmarks survive restart",
    );
  console.log(
    mode === "save"
      ? "Saved persistence snapshot."
      : "PASS: accounts, profiles, readings, alerts, care records, appointments, and benchmarks survived restart.",
  );
} finally {
  await client.dispose();
}
