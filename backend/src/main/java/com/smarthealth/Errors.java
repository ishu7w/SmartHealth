package com.smarthealth;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class Errors {

  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(
    Errors.class
  );

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<?> malformed() {
    return ResponseEntity.badRequest().body(
      Map.of("message", "Invalid request body")
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> invalid(MethodArgumentNotValidException e) {
    return ResponseEntity.badRequest().body(
      Map.of(
        "message",
        e
          .getBindingResult()
          .getFieldErrors()
          .stream()
          .map(x -> x.getField() + ": " + x.getDefaultMessage())
          .toList()
          .toString()
      )
    );
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      Map.of(
        "message",
        e.getReason() == null ? "Request could not be completed" : e.getReason()
      )
    );
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict() {
    return ResponseEntity.status(409).body(
      Map.of(
        "message",
        "This record already exists or has a conflicting reference"
      )
    );
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    if (e instanceof InterruptedException) Thread.currentThread().interrupt();
    log.error("Request failed", e);
    return ResponseEntity.status(500).body(
      Map.of("message", "The operation failed. Please retry.")
    );
  }
}
