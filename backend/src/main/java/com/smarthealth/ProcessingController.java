package com.smarthealth;

import jakarta.validation.Valid;
import java.lang.management.ManagementFactory;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/process")
class ProcessingController {

  final ParallelHealthProcessor processor;
  final Benchmarks benchmarks;

  ProcessingController(ParallelHealthProcessor p, Benchmarks b) {
    processor = p;
    benchmarks = b;
  }

  @PostMapping("/{mode}")
  Object run(
    @PathVariable String mode,
    @Valid @RequestBody Inputs.Benchmark input
  ) throws Exception {
    if (
      !List.of("sequential", "parallel", "compare").contains(mode)
    ) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return processor.benchmarkProcessing(input, mode);
  }

  @GetMapping("/benchmarks")
  Object history() {
    return benchmarks.findTop100ByOrderByCreatedAtDesc();
  }

  @GetMapping("/system")
  Object system() {
    var bean = ManagementFactory.getOperatingSystemMXBean();
    double load =
      bean instanceof com.sun.management.OperatingSystemMXBean b
        ? b.getProcessCpuLoad()
        : -1;
    return Map.of(
      "availableProcessors",
      Runtime.getRuntime().availableProcessors(),
      "architecture",
      System.getProperty("os.arch"),
      "os",
      System.getProperty("os.name"),
      "javaVersion",
      System.getProperty("java.version"),
      "processCpuLoad",
      load,
      "activeTasks",
      processor.activeTasks.get(),
      "usedHeapBytes",
      Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory(),
      "maxHeapBytes",
      Runtime.getRuntime().maxMemory()
    );
  }
}
