package com.smarthealth;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthcareIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  Users users;

  @Autowired
  Patients patients;

  @Autowired
  Records records;

  @Autowired
  Alerts alerts;

  @Autowired
  Benchmarks benchmarks;

  @Autowired
  ObjectMapper json;

  @Autowired
  PasswordEncoder passwords;

  @Autowired
  ParallelHealthProcessor processor;

  long aliceId, bobId;

  @BeforeEach
  void setup() {
    alerts.deleteAll();
    records.deleteAll();
    patients.deleteAll();
    benchmarks.deleteAll();
    users.deleteAll();
    for (String name : new String[] { "alice", "bob", "doctor", "admin" }) {
      var u = new Models.User();
      u.email = name + "@example.test";
      u.name = name;
      u.role = name.equals("doctor")
        ? "DOCTOR"
        : name.equals("admin")
          ? "ADMIN"
          : "PATIENT";
      u.password = passwords.encode("test-password-123");
      users.save(u);
      if (u.role.equals("PATIENT")) {
        var p = new Models.Patient();
        p.name = name;
        p.patientId = "P-" + name;
        p.userId = u.id;
        p.age = 25;
        p.gender = "Other";
        patients.save(p);
        if (name.equals("alice")) aliceId = p.id;
        else bobId = p.id;
      }
    }
  }

  String vitals(long patient, double oxygen) throws Exception {
    return json.writeValueAsString(
      new Inputs.Vitals(patient, 75, 115, 75, 36.8, oxygen, 90, 16, false)
    );
  }

  @Test
  void anonymousAndCsrfAreEnforced() throws Exception {
    mvc.perform(get("/api/patients")).andExpect(status().isUnauthorized());
    mvc
      .perform(
        post("/api/auth/register").contentType("application/json").content("{}")
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(get("/api/auth/csrf"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.token").isString());
  }

  @Test
  void registrationHashesPasswordAndNeverExposesIt() throws Exception {
    var body =
      "{\"name\":\"New Person\",\"email\":\"new@example.test\",\"password\":\"test-password-123\",\"role\":\"ADMIN\"}";
    mvc
      .perform(
        post("/api/auth/register")
          .with(csrf())
          .contentType("application/json")
          .content(body)
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.role").value("PATIENT"))
      .andExpect(jsonPath("$.password").doesNotExist());
    assertTrue(
      passwords.matches(
        "test-password-123",
        users.findByEmail("new@example.test").orElseThrow().password
      )
    );
    mvc
      .perform(
        post("/api/auth/register")
          .with(csrf())
          .contentType("application/json")
          .content(body)
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        post("/api/auth/login")
          .with(csrf())
          .param("username", "new@example.test")
          .param("password", "test-password-123")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        post("/api/auth/login")
          .with(csrf())
          .param("username", "new@example.test")
          .param("password", "wrong")
      )
      .andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void patientCannotReadOrWriteAnotherPatient() throws Exception {
    mvc
      .perform(get("/api/patients"))
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("alice"));
    mvc
      .perform(get("/api/patients/" + bobId))
      .andExpect(status().isForbidden());
    mvc
      .perform(get("/api/health-records/patient/" + bobId))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(bobId, 98))
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(delete("/api/patients/" + aliceId).with(csrf()))
      .andExpect(status().isForbidden());
    mvc.perform(get("/api/process/system")).andExpect(status().isForbidden());
    mvc.perform(get("/api/admin/doctors")).andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void recordsCreateAlertsAndRiskCannotHideCriticalSignal() throws Exception {
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(aliceId, 88))
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.healthStatus").value("Critical"))
      .andExpect(jsonPath("$.riskScore").value(76));
    mvc
      .perform(get("/api/health-records/latest/" + aliceId))
      .andExpect(jsonPath("$.spo2").value(88));
    mvc
      .perform(get("/api/alerts"))
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].riskLevel").value("Critical"));
    mvc
      .perform(
        put(
          "/api/alerts/" + alerts.findAll().getFirst().id + "/acknowledge"
        ).with(csrf())
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(get("/api/dashboard/statistics"))
      .andExpect(jsonPath("$.activeAlerts").value(1))
      .andExpect(jsonPath("$.riskDistribution.Critical").value(1));
  }

  @Test
  @WithMockUser(username = "doctor@example.test", roles = "DOCTOR")
  void doctorSeesPatientsAndManagesAlerts() throws Exception {
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(bobId, 88))
      )
      .andExpect(status().isCreated());
    long id = alerts.findAll().getFirst().id;
    mvc
      .perform(put("/api/alerts/" + id + "/acknowledge").with(csrf()))
      .andExpect(jsonPath("$.status").value("Acknowledged"));
    mvc
      .perform(put("/api/alerts/" + id + "/resolve").with(csrf()))
      .andExpect(jsonPath("$.status").value("Resolved"));
    mvc
      .perform(put("/api/alerts/" + id + "/acknowledge").with(csrf()))
      .andExpect(status().isConflict());
    mvc
      .perform(get("/api/patients?search=bob"))
      .andExpect(jsonPath("$.length()").value(1));
    mvc.perform(get("/api/admin/doctors")).andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(username = "doctor@example.test", roles = "DOCTOR")
  void disabledDoctorLosesExistingAccess() throws Exception {
    var u = users.findByEmail("doctor@example.test").orElseThrow();
    u.enabled = false;
    users.save(u);
    mvc
      .perform(get("/api/process/benchmarks"))
      .andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(username = "admin@example.test", roles = "ADMIN")
  void adminManagesDoctorsAndDeletesPatientData() throws Exception {
    mvc
      .perform(
        post("/api/admin/doctors")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"name\":\"Doctor Two\",\"email\":\"doc2@example.test\",\"password\":\"test-password-123\"}"
          )
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.role").value("DOCTOR"));
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(aliceId, 88))
      )
      .andExpect(status().isCreated());
    mvc
      .perform(delete("/api/patients/" + aliceId).with(csrf()))
      .andExpect(status().isNoContent());
    assertEquals(0, records.count());
    assertEquals(0, alerts.count());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void inputValidationRejectsInvalidVitalsAndMalformedJson() throws Exception {
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(aliceId, 105))
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content(vitals(aliceId, 98).replace("115.0", "60.0"))
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/health-records")
          .with(csrf())
          .contentType("application/json")
          .content("broken")
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        put("/api/patients/" + aliceId)
          .with(csrf())
          .contentType("application/json")
          .content("{\"name\":\"Alice\",\"age\":-1,\"gender\":\"Other\"}")
      )
      .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(username = "doctor@example.test", roles = "DOCTOR")
  void benchmarkEndpointValidatesAndPersistsMeasurements() throws Exception {
    mvc
      .perform(
        post("/api/process/compare")
          .with(csrf())
          .contentType("application/json")
          .content("{\"numberOfRecords\":100,\"threadCount\":2,\"seed\":42}")
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.sequential.processed").value(100))
      .andExpect(jsonPath("$.parallel.processed").value(100));
    var b = benchmarks.findAll().getFirst();
    assertTrue(b.sequentialTime > 0);
    assertTrue(b.parallelTime > 0);
    assertEquals(b.sequentialTime / b.parallelTime, b.speedup);
    assertEquals(b.sequentialTime - b.parallelTime, b.timeSaved);
    mvc
      .perform(
        post("/api/process/compare")
          .with(csrf())
          .contentType("application/json")
          .content("{\"numberOfRecords\":150,\"threadCount\":2}")
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/process/parallel")
          .with(csrf())
          .contentType("application/json")
          .content("{\"numberOfRecords\":100,\"threadCount\":0}")
      )
      .andExpect(status().isBadRequest());
  }

  @Test
  void allDatasetSizesProduceIdenticalResultsAndWorkersAreReleased()
    throws Exception {
    for (int size : new int[] { 100, 500, 1000, 5000, 10000 }) {
      var rows = processor.dataset(size, 42);
      var sequential = processor.processSequentially(rows);
      var parallel = processor.processParallel(rows, 4);
      assertEquals(size, parallel.processed());
      assertEquals(sequential.checksum(), parallel.checksum());
      assertEquals(0, processor.activeTasks.get());
      assertTrue(
        parallel
          .tasks()
          .stream()
          .allMatch(
            t -> t.thread().contains("pool-") && t.endMs() >= t.startMs()
          )
      );
    }
  }

  @Test
  void analyzerCategoryBoundariesAndCombinedWarnings() {
    var analyzer = new HealthAnalyzer();
    for (int score : new int[] { 0, 25, 26, 50, 51, 75, 76, 100 })
      assertEquals(
        score <= 25
          ? "Normal"
          : score <= 50
            ? "Attention Required"
            : score <= 75
              ? "High Risk"
              : "Critical",
        analyzer.status(score)
      );
    assertEquals(
      "Normal",
      analyzer
        .analyze(new Inputs.Vitals(1L, 75, 115, 75, 36.8, 98, 90, 16, false))
        .healthStatus()
    );
    assertEquals(
      "High Risk",
      analyzer
        .analyze(new Inputs.Vitals(1L, 110, 140, 90, 38, 92, 130, 25, false))
        .healthStatus()
    );
  }
}
