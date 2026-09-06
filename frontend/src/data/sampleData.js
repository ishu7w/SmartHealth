export const samplePatient = {
  name: "Demo Patient",
  age: 28,
  gender: "Female",
  heart_rate: 72,
  systolic_bp: 118,
  diastolic_bp: 78,
  spo2: 98,
  temperature: 98.6,
  glucose: 96,
  symptoms: [],
};
export const metrics = [
  {
    key: "heart_rate",
    label: "Heart Rate",
    unit: "BPM",
    color: "#e5e5e5",
    domain: [50, 110],
    range: "60–100 BPM",
  },
  {
    key: "blood_pressure",
    label: "Blood Pressure",
    unit: "mmHg",
    color: "#e5e5e5",
    range: "90–119 / 60–79 mmHg",
  },
  {
    key: "spo2",
    label: "SpO₂",
    unit: "%",
    color: "#e5e5e5",
    domain: [90, 100],
    range: "95–100%",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°F",
    color: "#e5e5e5",
    domain: [96, 101],
    range: "97–99.5°F",
  },
  {
    key: "glucose",
    label: "Blood Glucose",
    unit: "mg/dL",
    color: "#e5e5e5",
    range: "70–99 mg/dL (fasting)",
  },
];
export const overviewData = Array.from({ length: 13 }, (_, i) => ({
  time: `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  heart_rate: [72, 76, 71, 74, 68, 75, 72, 77, 71, 74, 69, 73, 72][i],
  spo2: [98, 97, 98, 99, 98, 97, 98, 98, 99, 98, 97, 99, 98][i],
  temperature: [
    98.6, 98.4, 98.5, 98.7, 98.5, 98.6, 98.8, 98.6, 98.4, 98.5, 98.7, 98.6,
    98.6,
  ][i],
}));
export const symptomOptions = [
  "Fever",
  "Headache",
  "Chest Pain",
  "Breathing Difficulty",
  "Fatigue",
  "Dizziness",
];
