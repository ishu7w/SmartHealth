export function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
// Spreadsheet-safe cells prevent user-entered text from becoming executable formulas.
export function csvCell(value) {
  const text = String(value ?? "");
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}
export function exportReadings(rows, patientId) {
  const columns = [
    "createdAt",
    "heartRate",
    "systolicBP",
    "diastolicBP",
    "temperature",
    "spo2",
    "glucose",
    "respiratoryRate",
    "riskScore",
    "healthStatus",
    "simulated",
  ];
  download(
    [
      columns.join(","),
      ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(",")),
    ].join("\r\n"),
    `${patientId}-readings.csv`,
    "text/csv;charset=utf-8",
  );
}
export function calendarFile(appointment) {
  const escape = (value) =>
    String(value)
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(",", "\\,")
      .replaceAll(";", "\\;")
      .replaceAll("\r", "");
  const utc = (value) =>
    new Date(value)
      .toISOString()
      .replaceAll(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartHealth//Academic Calendar//EN",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@smarthealth.local`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(appointment.scheduledAt)}`,
    `DTEND:${utc(new Date(appointment.scheduledAt).getTime() + 1800000)}`,
    `SUMMARY:${escape(`Appointment with ${appointment.doctorName}`)}`,
    `DESCRIPTION:${escape(`${appointment.visitType} visit. Confirm logistics with your care team. Exported from the SmartHealth academic prototype.`)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 folding with a conservative Unicode-safe byte limit.
  const folded = lines.flatMap((line) => {
    const out = [];
    let part = "";
    for (const c of line) {
      if (new TextEncoder().encode(part + c).length > 70) {
        out.push(part);
        part = " ";
      }
      part += c;
    }
    out.push(part);
    return out;
  });
  download(
    folded.join("\r\n") + "\r\n",
    `appointment-${appointment.id}.ics`,
    "text/calendar;charset=utf-8",
  );
}
