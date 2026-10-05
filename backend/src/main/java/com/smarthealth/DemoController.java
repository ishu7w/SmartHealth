package com.smarthealth;

import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
  name = "smarthealth.practice-tools",
  havingValue = "true"
)
@RequestMapping("/api/admin/demo")
class DemoController {

  final HealthcareService health;
  final CareService care;
  final Patients patients;

  DemoController(HealthcareService h, CareService c, Patients p) {
    health = h;
    care = c;
    patients = p;
  }

  @PostMapping
  @Transactional
  Object seed(Authentication auth) {
    var user = health.user(auth);
    int created = 0;
    String[] names = {
      "Demo · Avery (synthetic)",
      "Demo · Morgan (synthetic)",
      "Demo · Casey (synthetic)",
    };
    for (int i = 0; i < names.length; i++) {
      String name = names[i];
      if (
        patients
          .findAll()
          .stream()
          .anyMatch(p -> p.name.equals(name))
      ) continue;
      var p = health.save(
        null,
        new Inputs.Patient(
          name,
          25 + i * 10,
          "Other",
          "Unknown",
          170.0,
          65.0,
          "",
          "Demo contact — not a real phone number"
        ),
        user
      );
      for (int j = 0; j < 6; j++) health.record(
        new Inputs.Vitals(
          p.id,
          72 + i * 15 + j,
          112 + i * 12,
          72 + i * 4,
          36.5 + i * .4,
          i == 2 ? 88 : 98 - i,
          88 + i * 15,
          16 + i * 2,
          true
        ),
        user
      );
      care.profile(
        p.id,
        new CareInputs.Profile(
          "Not assessed — synthetic profile",
          "Synthetic demonstration only",
          "Discuss the recorded readings at the next demo visit."
        ),
        user
      );
      created++;
    }
    return Map.of(
      "createdPatients",
      created,
      "message",
      created == 0
        ? "Demo profiles already exist."
        : "Synthetic demo profiles and readings added."
    );
  }
}
