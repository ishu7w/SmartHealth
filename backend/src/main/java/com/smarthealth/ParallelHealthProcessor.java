package com.smarthealth;

import java.lang.management.ManagementFactory;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ParallelHealthProcessor {

  private final HealthAnalyzer analyzer;
  private final Benchmarks benchmarks;
  private final Semaphore gate = new Semaphore(1);
  final AtomicInteger activeTasks = new AtomicInteger();

  public record Task(
    int patientIndex,
    String thread,
    double startMs,
    double endMs,
    int riskScore
  ) {}

  public record Run(
    double totalMs,
    double cpuMs,
    @com.fasterxml.jackson.databind.annotation.JsonSerialize(
      using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class
    )
    long checksum,
    int processed,
    List<Task> tasks
  ) {}

  public record Comparison(
    Models.Benchmark summary,
    Run sequential,
    Run parallel,
    int availableProcessors,
    String workload
  ) {}

  record Output(long checksum, Task task) {}

  public ParallelHealthProcessor(HealthAnalyzer a, Benchmarks b) {
    analyzer = a;
    benchmarks = b;
  }

  public List<Inputs.Vitals> dataset(int size, long seed) {
    var random = new Random(seed);
    var rows = new ArrayList<Inputs.Vitals>(size);
    for (int i = 0; i < size; i++) {
      int systolic = 90 + random.nextInt(100),
        diastolic = Math.min(systolic - 10, 55 + random.nextInt(50));
      rows.add(
        new Inputs.Vitals(
          (long) i,
          45 + random.nextInt(90),
          systolic,
          diastolic,
          35.5 + random.nextDouble() * 4.5,
          85 + random.nextInt(16),
          50 + random.nextInt(180),
          8 + random.nextInt(27),
          true
        )
      );
    }
    return List.copyOf(rows);
  }

  private Output task(Inputs.Vitals patient, int index, long origin) {
    activeTasks.incrementAndGet();
    long start = System.nanoTime();
    try {
      var analysis = analyzer.analyze(patient);
      // Explicit CPU-only educational workload; result is consumed to prevent dead-code elimination.
      // Both runners do precisely the same calculation, with no artificial sleep or invented timing.
      long checksum = analysis.riskScore() + index;
      for (int i = 0; i < 12000; i++) checksum =
        Long.rotateLeft(checksum ^ (i * 0x9E3779B97F4A7C15L), 7) +
        Double.doubleToLongBits(patient.heartRate());
      return new Output(
        checksum,
        new Task(
          index,
          Thread.currentThread().getName(),
          (start - origin) / 1e6,
          (System.nanoTime() - origin) / 1e6,
          analysis.riskScore()
        )
      );
    } finally {
      activeTasks.decrementAndGet();
    }
  }

  private long cpuTime() {
    var bean = ManagementFactory.getOperatingSystemMXBean();
    return bean instanceof com.sun.management.OperatingSystemMXBean b
      ? b.getProcessCpuTime()
      : -1;
  }

  public Run processSequentially(List<Inputs.Vitals> rows) {
    long cpu = cpuTime(),
      start = System.nanoTime(),
      checksum = 0;
    var sample = new ArrayList<Task>();
    for (int i = 0; i < rows.size(); i++) {
      var output = task(rows.get(i), i, start);
      checksum += output.checksum;
      if (i < 100) sample.add(output.task);
    }
    return new Run(
      (System.nanoTime() - start) / 1e6,
      (cpuTime() - cpu) / 1e6,
      checksum,
      rows.size(),
      sample
    );
  }

  public Run processParallel(List<Inputs.Vitals> rows, int threads)
    throws Exception {
    long cpu = cpuTime(),
      start = System.nanoTime();
    var executor = Executors.newFixedThreadPool(threads);
    var futures = new ArrayList<Future<Output>>(rows.size());
    try {
      for (int i = 0; i < rows.size(); i++) {
        final int index = i;
        futures.add(executor.submit(() -> task(rows.get(index), index, start)));
      }
      long checksum = 0;
      var sample = new ArrayList<Task>();
      for (int i = 0; i < futures.size(); i++) {
        var output = futures.get(i).get(60, TimeUnit.SECONDS);
        checksum += output.checksum;
        if (i < 100) sample.add(output.task);
      }
      return new Run(
        (System.nanoTime() - start) / 1e6,
        (cpuTime() - cpu) / 1e6,
        checksum,
        rows.size(),
        sample
      );
    } finally {
      executor.shutdownNow();
      if (
        !executor.awaitTermination(5, TimeUnit.SECONDS)
      ) throw new IllegalStateException("Workers did not terminate");
    }
  }

  public Comparison benchmarkProcessing(Inputs.Benchmark input, String mode)
    throws Exception {
    if (
      !List.of(100, 500, 1000, 5000, 10000).contains(input.numberOfRecords())
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Choose a supported dataset size"
    );
    if (!gate.tryAcquire()) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "A benchmark is already running; retry when it finishes"
    );
    try {
      var rows = dataset(input.numberOfRecords(), input.seed());
      // Small unmeasured warm-up reduces first-call class loading; JIT and host load can still affect results.
      processSequentially(rows.subList(0, Math.min(50, rows.size())));
      Run sequential = mode.equals("parallel")
        ? null
        : processSequentially(rows);
      Run parallel = mode.equals("sequential")
        ? null
        : processParallel(rows, input.threadCount());
      if (
        sequential != null &&
        parallel != null &&
        sequential.checksum != parallel.checksum
      ) throw new IllegalStateException("Results do not match");
      var b = new Models.Benchmark();
      b.mode = mode;
      b.numberOfRecords = rows.size();
      b.threadCount = mode.equals("sequential") ? 1 : input.threadCount();
      b.seed = input.seed();
      b.sequentialTime = sequential == null ? null : sequential.totalMs;
      b.parallelTime = parallel == null ? null : parallel.totalMs;
      if (sequential != null && parallel != null) {
        b.speedup = sequential.totalMs / parallel.totalMs;
        b.timeSaved = sequential.totalMs - parallel.totalMs;
      }
      Run measured = parallel == null ? sequential : parallel;
      b.checksum = measured.checksum;
      b.processCpuMs = measured.cpuMs;
      benchmarks.save(b);
      return new Comparison(
        b,
        sequential,
        parallel,
        Runtime.getRuntime().availableProcessors(),
        "CPU-only synthetic mixing: 12,000 iterations plus six vital checks per patient; first 100 task timings shown. Process CPU time includes other JVM activity."
      );
    } finally {
      gate.release();
    }
  }
}
