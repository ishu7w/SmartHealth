# Patient portal research and implementation

Reviewed 2 October 2026. The sources are official product descriptions; SmartHealth does not integrate with or represent these services.

| Source | Relevant pattern | SmartHealth implementation |
|---|---|---|
| [MyChart features](https://www.mychart.org/Features) | Health summaries, medication lists, appointment management | Care record with allergies/history/notes, medication tracking, printable summary, appointment timeline |
| [NHS App features](https://digital.nhs.uk/services/nhs-app/nhs-app-features) | Accessible records and appointment information | Reading trends, CSV export, upcoming visits, clear request/confirmation status |

## Features delivered

- **Care record:** allergies and reactions, conditions/history, and questions for the next visit. Empty fields explicitly mean “not recorded”.
- **Medication list:** name, instructions, schedule, notes, active/stopped status, recorded-by/source labels. These are entered records, not prescriptions or automated dosing guidance.
- **Reading trends:** seven measurement views including both blood-pressure values; entered-only default keeps synthetic monitoring data out of the personal trend unless requested.
- **Portable summary:** print/save PDF in the browser; download the latest visible readings as CSV. Spreadsheet formula escaping is tested. No third-party export service receives data.
- **Appointments:** request a date/time and active doctor; staff confirms, cancels, or completes visits. Requests are not advertised as available slots. The assigned doctor/admin can manage a request; patient owners can cancel. Confirmed 30-minute appointments cannot overlap for a doctor or patient. Version checks prevent stale changes.
- **Calendar export:** confirmed appointments download an RFC 5545 calendar file with timezone-safe UTC timestamps. It is an export, not a synced calendar or automatic reminder service.
- **Demo preparation:** administrators can add three named synthetic profiles and readings. Existing demo names are skipped. Benchmarks remain measured on demand.

## Scope boundaries

No real clinic connection, pharmacy integration, payment, automated diagnosis, email/SMS delivery, or emergency dispatch is implied. The value here is organizing information and managing a complete request/review workflow within the project. Real clinical use would need verified provider onboarding and a separate privacy/security/clinical validation process.

The original visual identity and Java parallel-processing laboratory are retained. Embedded H2 storage is now the default at the user's request; MySQL is not required. Durable hosting requires one Java process and a persistent disk.
