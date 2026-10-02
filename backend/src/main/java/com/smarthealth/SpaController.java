package com.smarthealth;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Browser routes for the combined Docker/JAR build. API routes never fall back to HTML. */
@Controller
class SpaController {

  @GetMapping({
    "/",
    "/account",
    "/patients",
    "/analysis",
    "/monitoring",
    "/parallel",
    "/alerts",
    "/doctors",
    "/about",
    "/care",
    "/appointments",
  })
  String index() {
    return "forward:/index.html";
  }
}
