package com.smarthealth;

import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class HealthAnalyzer {

  public record Signal(
    String parameter,
    double value,
    int risk,
    String message
  ) {}

  public record Analysis(
    int riskScore,
    String healthStatus,
    List<Signal> signals
  ) {}

  public Analysis analyze(Inputs.Vitals v) {
    var signals = List.of(
      signal(
        "Heart rate",
        v.heartRate(),
        v.heartRate() >= 60 && v.heartRate() <= 100,
        v.heartRate() < 40 || v.heartRate() > 140,
        "Outside 60–100 BPM"
      ),
      signal(
        "Blood pressure",
        v.systolicBP(),
        v.systolicBP() >= 90 &&
          v.systolicBP() < 120 &&
          v.diastolicBP() >= 60 &&
          v.diastolicBP() < 80,
        v.systolicBP() < 80 ||
          v.systolicBP() >= 180 ||
          v.diastolicBP() < 50 ||
          v.diastolicBP() >= 120,
        "Outside 90–119 / 60–79 mmHg"
      ),
      signal(
        "SpO2",
        v.spo2(),
        v.spo2() >= 95,
        v.spo2() < 90,
        "Low oxygen level"
      ),
      signal(
        "Temperature",
        v.temperature(),
        v.temperature() >= 36.1 && v.temperature() <= 37.5,
        v.temperature() > 38.4 || v.temperature() < 35,
        "Body temperature outside demo range (°C)"
      ),
      signal(
        "Glucose",
        v.glucose(),
        v.glucose() >= 70 && v.glucose() < 100,
        v.glucose() < 54 || v.glucose() >= 180,
        "Glucose outside fasting demo range"
      ),
      signal(
        "Respiratory rate",
        v.respiratoryRate(),
        v.respiratoryRate() >= 12 && v.respiratoryRate() <= 20,
        v.respiratoryRate() < 8 || v.respiratoryRate() > 30,
        "Respiratory rate outside demo range"
      )
    );
    int score = (int) Math.round(
      signals.stream().mapToInt(Signal::risk).average().orElse(0)
    );
    // A critical signal must never disappear in an average of otherwise normal measurements.
    if (signals.stream().anyMatch(s -> s.risk() == 100)) score = Math.max(
      76,
      score
    );
    else if (signals.stream().anyMatch(s -> s.risk() > 0)) score = Math.max(
      26,
      score
    );
    return new Analysis(score, status(score), signals);
  }

  private Signal signal(
    String name,
    double value,
    boolean normal,
    boolean critical,
    String message
  ) {
    int risk = critical ? 100 : normal ? 0 : 60;
    return new Signal(
      name,
      value,
      risk,
      risk == 0 ? "Within demo range" : message
    );
  }

  public String status(int score) {
    return score <= 25
      ? "Normal"
      : score <= 50
        ? "Attention Required"
        : score <= 75
          ? "High Risk"
          : "Critical";
  }
}
