package com.smarthealth;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = {
    "smarthealth.practice-tools=false",
    "spring.datasource.url=jdbc:h2:mem:production-mode;DB_CLOSE_DELAY=-1",
  }
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductionModeTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  Users users;

  @Autowired
  Patients patients;

  @Autowired
  HealthcareService health;

  @Autowired
  org.springframework.context.ApplicationContext context;

  @Test
  void normalWorkspaceCannotGenerateDemoPatientsOrSyntheticReadings()
    throws Exception {
    assertTrue(context.getBeansOfType(DemoController.class).isEmpty());
    assertTrue(context.getBeansOfType(ProcessingController.class).isEmpty());
    mvc
      .perform(
        post("/api/admin/demo")
          .with(user("operator@example.test").roles("ADMIN"))
          .with(csrf())
      )
      .andExpect(status().isUnauthorized());
    var u = new Models.User();
    u.name = "Patient";
    u.email = "patient@example.test";
    u.role = "PATIENT";
    u.password = "unused";
    users.save(u);
    var p = new Models.Patient();
    p.name = u.name;
    p.patientId = "PRODUCTION-MODE";
    p.userId = u.id;
    patients.save(p);
    mvc
      .perform(
        post("/api/admin/demo").with(user(u.email).roles("ADMIN")).with(csrf())
      )
      .andExpect(status().isNotFound());
    mvc
      .perform(get("/api/portal/config").with(user(u.email).roles("PATIENT")))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.practiceTools").value(false));
    mvc
      .perform(
        post("/api/health-records")
          .with(user(u.email).roles("PATIENT"))
          .with(csrf())
          .contentType("application/json")
          .content(
            "{\"patientId\":" +
              p.id +
              ",\"heartRate\":75,\"systolicBP\":115,\"diastolicBP\":75,\"temperature\":36.8,\"spo2\":98,\"glucose\":90,\"respiratoryRate\":16,\"simulated\":true}"
          )
      )
      .andExpect(status().isForbidden());
  }
}
