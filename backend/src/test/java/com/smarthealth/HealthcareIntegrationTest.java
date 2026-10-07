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

  @Autowired
  CareProfiles careProfiles;

  @Autowired
  Medications medications;

  @Autowired
  Appointments appointments;

  @Autowired
  Conversations conversations;

  @Autowired
  CareMessages careMessages;

  @Autowired
  FollowUpTasks followUpTasks;

  long aliceId, bobId;

  @BeforeEach
  void setup() {
    careMessages.deleteAll();
    conversations.deleteAll();
    followUpTasks.deleteAll();
    appointments.deleteAll();
    medications.deleteAll();
    careProfiles.deleteAll();
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
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void careRecordAndMedicationArePrivateAndPersisted() throws Exception {
    mvc
      .perform(
        put("/api/patients/" + aliceId + "/care-profile")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"allergies\":\"Synthetic latex reaction\",\"conditions\":\"Demo history\",\"careNotes\":\"Questions for next visit\"}"
          )
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        post("/api/patients/" + aliceId + "/medications")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"name\":\"Demo medicine\",\"dose\":\"As instructed\",\"schedule\":\"Morning\",\"notes\":\"Synthetic only\"}"
          )
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.source").value("Patient entered"));
    mvc
      .perform(get("/api/patients/" + aliceId + "/summary"))
      .andExpect(
        jsonPath("$.profile.allergies").value("Synthetic latex reaction")
      )
      .andExpect(jsonPath("$.medications.length()").value(1));
    mvc
      .perform(get("/api/patients/" + bobId + "/summary"))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        put("/api/patients/" + bobId + "/care-profile")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"allergies\":\"\",\"conditions\":\"\",\"careNotes\":\"\"}"
          )
      )
      .andExpect(status().isForbidden());
    long id = medications.findAll().getFirst().id;
    mvc
      .perform(
        put("/api/medications/" + id + "/status")
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Stopped\"}")
      )
      .andExpect(jsonPath("$.status").value("Stopped"));
    mvc
      .perform(
        put("/api/medications/" + id + "/status")
          .with(user("bob@example.test").roles("PATIENT"))
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Active\"}")
      )
      .andExpect(status().isForbidden());
  }

  private long requestVisit(long patientId, java.time.Instant time)
    throws Exception {
    long doctorId = users.findByEmail("doctor@example.test").orElseThrow().id;
    String body = json.writeValueAsString(
      new CareInputs.Appointment(
        patientId,
        doctorId,
        time,
        "Phone",
        "Synthetic follow-up"
      )
    );
    var response = mvc
      .perform(
        post("/api/appointments")
          .with(csrf())
          .contentType("application/json")
          .content(body)
      )
      .andExpect(status().isCreated())
      .andReturn();
    return json
      .readTree(response.getResponse().getContentAsString())
      .get("id")
      .asLong();
  }

  private String appointmentChange(String status, long version)
    throws Exception {
    return json.writeValueAsString(
      new CareInputs.AppointmentUpdate(
        status,
        "Demo visit instructions",
        version
      )
    );
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void patientCanRequestAndCancelButCannotConfirmOrReadOthers()
    throws Exception {
    var time = java.time.Instant.now().plusSeconds(86400);
    long id = requestVisit(aliceId, time);
    mvc
      .perform(
        put("/api/appointments/" + id)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Confirmed", 0))
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/appointments").with(user("bob@example.test").roles("PATIENT"))
      )
      .andExpect(jsonPath("$.length()").value(0));
    mvc
      .perform(
        put("/api/appointments/" + id)
          .with(user("bob@example.test").roles("PATIENT"))
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Cancelled", 0))
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        put("/api/appointments/" + id)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Cancelled", 0))
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.staffNotes").value(""));
    mvc
      .perform(
        put("/api/appointments/" + id)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Cancelled", 1))
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        post("/api/appointments")
          .with(csrf())
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              new CareInputs.Appointment(
                aliceId,
                users.findByEmail("doctor@example.test").orElseThrow().id,
                java.time.Instant.now().minusSeconds(100),
                "Phone",
                "Past time"
              )
            )
          )
      )
      .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(username = "doctor@example.test", roles = "DOCTOR")
  void doctorConfirmationPreventsOverlapAndStaleUpdates() throws Exception {
    var time = java.time.Instant.now().plusSeconds(86400);
    long first = requestVisit(aliceId, time),
      second = requestVisit(bobId, time.plusSeconds(900));
    mvc
      .perform(
        put("/api/appointments/" + first)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Confirmed", 0))
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        put("/api/appointments/" + second)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Confirmed", 0))
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        put("/api/appointments/" + first)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Cancelled", 0))
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        put("/api/appointments/" + first)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Completed", 1))
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        put("/api/appointments/" + first)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Cancelled", 1))
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        put("/api/appointments/" + second)
          .with(csrf())
          .contentType("application/json")
          .content(appointmentChange("Confirmed", 0))
      )
      .andExpect(status().isOk());
  }

  @Test
  @WithMockUser(username = "admin@example.test", roles = "ADMIN")
  void deletingPatientRemovesCareDataAndDemoSeedIsRepeatable()
    throws Exception {
    requestVisit(aliceId, java.time.Instant.now().plusSeconds(86400));
    var medication = new CareModels.Medication();
    medication.patientId = aliceId;
    medication.name = "Demo";
    medications.save(medication);
    var profile = new CareModels.Profile();
    profile.patientId = aliceId;
    careProfiles.save(profile);
    mvc
      .perform(delete("/api/patients/" + aliceId).with(csrf()))
      .andExpect(status().isNoContent());
    assertEquals(0, appointments.count());
    assertEquals(0, medications.count());
    assertEquals(0, careProfiles.count());
    mvc
      .perform(post("/api/admin/demo").with(csrf()))
      .andExpect(jsonPath("$.createdPatients").value(3));
    mvc
      .perform(post("/api/admin/demo").with(csrf()))
      .andExpect(jsonPath("$.createdPatients").value(0));
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

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void messagesArePrivateAndUnreadAcknowledgesOnlyDisplayedMessages()
    throws Exception {
    var body = json.writeValueAsString(
      new PortalController.NewConversation(
        aliceId,
        users.findByEmail("doctor@example.test").orElseThrow().id,
        "Follow up",
        "Question for care team"
      )
    );
    var response = mvc
      .perform(
        post("/api/conversations")
          .with(csrf())
          .contentType("application/json")
          .content(body)
      )
      .andExpect(status().isCreated())
      .andReturn();
    long id = json
      .readTree(response.getResponse().getContentAsString())
      .get("id")
      .asLong();
    long first = careMessages.findAll().getFirst().id;
    mvc
      .perform(get("/api/conversations"))
      .andExpect(jsonPath("$.length()").value(1));
    mvc
      .perform(
        get("/api/conversations/" + id).with(
          user("bob@example.test").roles("PATIENT")
        )
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        post("/api/conversations/" + id + "/messages")
          .with(user("bob@example.test").roles("PATIENT"))
          .with(csrf())
          .contentType("application/json")
          .content("{\"body\":\"Intrusion\"}")
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        post("/api/conversations/" + id + "/messages")
          .with(user("doctor@example.test").roles("DOCTOR"))
          .with(csrf())
          .contentType("application/json")
          .content("{\"body\":\"Please bring your readings\"}")
      )
      .andExpect(status().isCreated());
    mvc
      .perform(
        post("/api/conversations/" + id + "/read")
          .with(csrf())
          .contentType("application/json")
          .content("{\"messageId\":" + first + "}")
      )
      .andExpect(status().isNoContent());
    var saved = conversations.findById(id).orElseThrow();
    assertTrue(saved.updatedAt.isAfter(saved.patientReadAt));
    mvc
      .perform(get("/api/conversations/" + id))
      .andExpect(jsonPath("$.messages.length()").value(2))
      .andExpect(
        jsonPath("$.messages[1].body").value("Please bring your readings")
      );
    mvc
      .perform(get("/api/conversations/" + id + "?page=-1"))
      .andExpect(status().isBadRequest());
    for (int i = 0; i < 50; i++) {
      var m = new PortalModels.Message();
      m.conversationId = id;
      m.senderId = users.findByEmail("alice@example.test").orElseThrow().id;
      m.senderName = "alice";
      m.senderRole = "PATIENT";
      m.body = "Older history check " + i;
      careMessages.save(m);
    }
    mvc
      .perform(get("/api/conversations/" + id))
      .andExpect(jsonPath("$.messages.length()").value(50))
      .andExpect(jsonPath("$.hasOlder").value(true));
    mvc
      .perform(get("/api/conversations/" + id + "?page=1"))
      .andExpect(jsonPath("$.messages.length()").value(2))
      .andExpect(jsonPath("$.hasOlder").value(false));
    mvc
      .perform(
        delete("/api/patients/" + aliceId)
          .with(user("admin@example.test").roles("ADMIN"))
          .with(csrf())
      )
      .andExpect(status().isNoContent());
    assertEquals(0, careMessages.count());
    assertEquals(0, conversations.count());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void otherDoctorsCannotReadMessagesAndDisabledDoctorCannotReceiveReplies()
    throws Exception {
    var other = new Models.User();
    other.email = "other@example.test";
    other.name = "Other";
    other.role = "DOCTOR";
    other.password = passwords.encode("test-password-123");
    users.save(other);
    long doctor = users.findByEmail("doctor@example.test").orElseThrow().id;
    mvc
      .perform(
        post("/api/conversations")
          .with(csrf())
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              new PortalController.NewConversation(
                aliceId,
                doctor,
                "Question",
                "Hello"
              )
            )
          )
      )
      .andExpect(status().isCreated());
    long id = conversations.findAll().getFirst().id;
    mvc
      .perform(
        get("/api/conversations").with(user(other.email).roles("DOCTOR"))
      )
      .andExpect(jsonPath("$.length()").value(0));
    mvc
      .perform(
        get("/api/conversations/" + id).with(user(other.email).roles("DOCTOR"))
      )
      .andExpect(status().isForbidden());
    var d = users.findById(doctor).orElseThrow();
    d.enabled = false;
    users.save(d);
    mvc
      .perform(
        post("/api/conversations/" + id + "/messages")
          .with(csrf())
          .contentType("application/json")
          .content("{\"body\":\"Hello\"}")
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        post("/api/conversations")
          .with(csrf())
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              new PortalController.NewConversation(
                bobId,
                other.id,
                "Question",
                "Hello"
              )
            )
          )
      )
      .andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void followUpTasksEnforceOwnershipValidationAndStaleVersions()
    throws Exception {
    String body = json.writeValueAsString(
      new PortalController.NewTask(
        "Bring measurements",
        "Record your questions",
        java.time.LocalDate.now().plusDays(1)
      )
    );
    mvc
      .perform(
        post("/api/patients/" + aliceId + "/tasks")
          .with(csrf())
          .contentType("application/json")
          .content(body)
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.source").value("Personal task"));
    long id = followUpTasks.findAll().getFirst().id;
    mvc
      .perform(get("/api/patients/" + bobId + "/tasks"))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        put("/api/tasks/" + id)
          .with(user("bob@example.test").roles("PATIENT"))
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Completed\",\"version\":0}")
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        put("/api/tasks/" + id)
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Completed\",\"version\":0}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        put("/api/tasks/" + id)
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Open\",\"version\":0}")
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        put("/api/tasks/" + id)
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Open\",\"version\":1}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        post("/api/patients/" + aliceId + "/tasks")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"title\":\" \",\"instructions\":\"\",\"dueDate\":\"2026-10-06\"}"
          )
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        delete("/api/patients/" + aliceId)
          .with(user("admin@example.test").roles("ADMIN"))
          .with(csrf())
      )
      .andExpect(status().isNoContent());
    assertEquals(0, followUpTasks.count());
  }

  @Test
  void emailNormalizationIsIndependentOfServerLocale() throws Exception {
    var previous = java.util.Locale.getDefault();
    try {
      java.util.Locale.setDefault(java.util.Locale.forLanguageTag("tr-TR"));
      mvc
        .perform(
          post("/api/auth/register")
            .with(csrf())
            .contentType("application/json")
            .content(
              "{\"name\":\"Locale test\",\"email\":\"ISHU@example.test\",\"password\":\"test-password-123\"}"
            )
        )
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.email").value("ishu@example.test"));
      mvc
        .perform(
          post("/api/auth/login")
            .with(csrf())
            .param("username", "ISHU@example.test")
            .param("password", "test-password-123")
        )
        .andExpect(status().isOk());
    } finally {
      java.util.Locale.setDefault(previous);
    }
  }

  @Test
  @WithMockUser(username = "admin@example.test", roles = "ADMIN")
  void incompleteDoctorAccessRequestDoesNotDisableAccount() throws Exception {
    long id = users.findByEmail("doctor@example.test").orElseThrow().id;
    for (String body : new String[] { "{}", "{\"enabled\":null}" }) {
      mvc
        .perform(
          put("/api/admin/doctors/" + id + "/enabled")
            .with(csrf())
            .contentType("application/json")
            .content(body)
        )
        .andExpect(status().isBadRequest());
      assertTrue(users.findById(id).orElseThrow().enabled);
    }
    mvc
      .perform(
        put("/api/admin/doctors/" + id + "/enabled")
          .with(csrf())
          .contentType("application/json")
          .content("{\"enabled\":false}")
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.enabled").value(false));
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void unsupportedMethodsAndMediaTypesReturnClientErrors() throws Exception {
    mvc
      .perform(post("/api/patients/" + aliceId + "/summary").with(csrf()))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        header().string("Allow", org.hamcrest.Matchers.containsString("GET"))
      );
    mvc
      .perform(
        put("/api/patients/" + aliceId + "/care-profile")
          .with(csrf())
          .contentType("text/plain")
          .content("not JSON")
      )
      .andExpect(status().isUnsupportedMediaType());
  }

  @Test
  @WithMockUser(username = "alice@example.test", roles = "PATIENT")
  void updateRequestsRequireExplicitVersions() throws Exception {
    long visit = requestVisit(
      aliceId,
      java.time.Instant.now().plusSeconds(86400)
    );
    mvc
      .perform(
        put("/api/appointments/" + visit)
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Cancelled\",\"staffNotes\":\"\"}")
      )
      .andExpect(status().isBadRequest());
    mvc
      .perform(
        post("/api/patients/" + aliceId + "/tasks")
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"title\":\"Bring readings\",\"instructions\":\"\",\"dueDate\":\"2027-01-01\"}"
          )
      )
      .andExpect(status().isCreated());
    long task = followUpTasks.findAll().getFirst().id;
    mvc
      .perform(
        put("/api/tasks/" + task)
          .with(csrf())
          .contentType("application/json")
          .content("{\"status\":\"Completed\"}")
      )
      .andExpect(status().isBadRequest());
    assertEquals(
      "Requested",
      appointments.findById(visit).orElseThrow().status
    );
    assertEquals("Open", followUpTasks.findById(task).orElseThrow().status);
  }

  @Test
  @WithMockUser(username = "doctor@example.test", roles = "DOCTOR")
  void doctorTimelineDoesNotExposeOtherDoctorsAppointments() throws Exception {
    var other = new Models.User();
    other.email = "other@example.test";
    other.name = "Other doctor";
    other.role = "DOCTOR";
    other.password = "unused";
    users.save(other);
    var visit = new CareModels.Appointment();
    visit.patientId = aliceId;
    visit.doctorId = other.id;
    visit.patientName = "alice";
    visit.doctorName = other.name;
    visit.reason = "Private visit";
    visit.scheduledAt = java.time.Instant.now().plusSeconds(86400);
    appointments.save(visit);
    mvc
      .perform(get("/api/appointments"))
      .andExpect(jsonPath("$.length()").value(0));
    mvc
      .perform(get("/api/patients/" + aliceId + "/summary"))
      .andExpect(jsonPath("$.appointments.length()").value(0));
    mvc
      .perform(
        get("/api/appointments").with(user("admin@example.test").roles("ADMIN"))
      )
      .andExpect(jsonPath("$.length()").value(1));
    mvc
      .perform(
        get("/api/appointments").with(
          user("alice@example.test").roles("PATIENT")
        )
      )
      .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  void concurrentFirstCareProfileSavesDoNotConflict() throws Exception {
    var pool = java.util.concurrent.Executors.newFixedThreadPool(6);
    var start = new java.util.concurrent.CountDownLatch(1);
    try {
      var results = new java.util.ArrayList<
        java.util.concurrent.Future<Integer>
      >();
      for (int i = 0; i < 6; i++) results.add(
        pool.submit(() -> {
          start.await();
          return mvc
            .perform(
              put("/api/patients/" + aliceId + "/care-profile")
                .with(user("alice@example.test").roles("PATIENT"))
                .with(csrf())
                .contentType("application/json")
                .content(
                  "{\"allergies\":\"Test\",\"conditions\":\"\",\"careNotes\":\"\"}"
                )
            )
            .andReturn()
            .getResponse()
            .getStatus();
        })
      );
      start.countDown();
      for (var result : results)
        assertEquals(
          200,
          result.get(15, java.util.concurrent.TimeUnit.SECONDS)
        );
      assertEquals(1, careProfiles.count());
    } finally {
      pool.shutdownNow();
    }
  }
}
