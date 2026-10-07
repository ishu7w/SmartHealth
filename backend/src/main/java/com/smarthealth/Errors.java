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

  @ExceptionHandler(
    org.springframework.web.servlet.resource.NoResourceFoundException.class
  )
  ResponseEntity<?> missing() {
    return ResponseEntity.status(404).body(
      Map.of("message", "This feature or address is unavailable")
    );
  }

  @ExceptionHandler({
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    org.springframework.web.bind.MissingServletRequestParameterException.class,
  })
  ResponseEntity<?> parameter() {
    return ResponseEntity.badRequest().body(
      Map.of("message", "Invalid request parameter")
    );
  }

  @ExceptionHandler(
    org.springframework.dao.OptimisticLockingFailureException.class
  )
  ResponseEntity<?> stale() {
    return ResponseEntity.status(409).body(
      Map.of("message", "This record changed. Refresh and try again.")
    );
  }

  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(
    Errors.class
  );

  @ExceptionHandler(
    org.springframework.web.HttpRequestMethodNotSupportedException.class
  )
  ResponseEntity<?> method(
    org.springframework.web.HttpRequestMethodNotSupportedException e
  ) {
    var headers = new HttpHeaders();
    if (e.getSupportedHttpMethods() != null) headers.setAllow(
      e.getSupportedHttpMethods()
    );
    return ResponseEntity.status(405)
      .headers(headers)
      .body(Map.of("message", "This HTTP method is not supported"));
  }

  @ExceptionHandler(
    org.springframework.web.HttpMediaTypeNotSupportedException.class
  )
  ResponseEntity<?> media() {
    return ResponseEntity.status(415).body(
      Map.of("message", "Send the request as application/json")
    );
  }

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
