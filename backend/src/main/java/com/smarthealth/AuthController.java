package com.smarthealth;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
class AuthController {

  private final Users users;
  private final PasswordEncoder passwords;

  AuthController(Users users, PasswordEncoder passwords) {
    this.users = users;
    this.passwords = passwords;
  }

  @GetMapping("/health")
  Object health() {
    return Map.of(
      "status",
      "ok",
      "runtime",
      "Java",
      "processors",
      Runtime.getRuntime().availableProcessors()
    );
  }

  @GetMapping("/auth/csrf")
  Object csrf(CsrfToken token) {
    return Map.of(
      "token",
      token.getToken(),
      "headerName",
      token.getHeaderName()
    );
  }

  @GetMapping("/auth/me")
  Models.User me(Authentication auth) {
    return users.findByEmail(auth.getName()).orElseThrow();
  }

  @PostMapping("/auth/register")
  @ResponseStatus(HttpStatus.CREATED)
  Models.User register(@Valid @RequestBody Inputs.Register input) {
    return create(input, "PATIENT");
  }

  @GetMapping("/admin/doctors")
  List<Models.User> doctors() {
    return users
      .findAll()
      .stream()
      .filter(u -> u.role.equals("DOCTOR"))
      .toList();
  }

  @PostMapping("/admin/doctors")
  @ResponseStatus(HttpStatus.CREATED)
  Models.User doctor(@Valid @RequestBody Inputs.Register input) {
    return create(input, "DOCTOR");
  }

  @PutMapping("/admin/doctors/{id}/enabled")
  Models.User enabled(
    @PathVariable Long id,
    @RequestBody Map<String, Boolean> body
  ) {
    var user = users
      .findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (!"DOCTOR".equals(user.role)) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Not a doctor"
    );
    user.enabled = Boolean.TRUE.equals(body.get("enabled"));
    return users.save(user);
  }

  private Models.User create(Inputs.Register input, String role) {
    if (
      input
        .password()
        .getBytes(java.nio.charset.StandardCharsets.UTF_8)
        .length > 72
    ) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Password must fit within 72 UTF-8 bytes"
      );
    }
    String email = input.email().trim().toLowerCase();
    if (users.findByEmail(email).isPresent()) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Email already registered"
    );
    var user = new Models.User();
    user.email = email;
    user.name = input.name().trim();
    user.password = passwords.encode(input.password());
    user.role = role;
    return users.save(user);
  }

  @Bean
  ApplicationRunner bootstrap(
    @Value("${smarthealth.admin.email}") String email,
    @Value("${smarthealth.admin.password}") String password
  ) {
    return args -> {
      if (
        !email.isBlank() && users.findByEmail(email.toLowerCase()).isEmpty()
      ) {
        if (password.length() < 12) throw new IllegalStateException(
          "ADMIN_PASSWORD must contain at least 12 characters"
        );
        create(new Inputs.Register(email, password, "Administrator"), "ADMIN");
      }
    };
  }
}
