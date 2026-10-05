# Patient portal research and implementation

Reviewed 5 October 2026 against official product pages. SmartHealth is independent of these providers and has no connection to their records or clinicians.

| Comparable service | Documented feature | Useful pattern for SmartHealth |
|---|---|---|
| [Patient Access](https://www.patientaccess.com/gp-features) | Appointments, practice messaging, repeat requests, sharing records | Reduce phone calls through a named-doctor inbox and a clear appointment request lifecycle |
| [Mayo Clinic Patient Online Services](https://www.mayoclinic.org/patient-visitor-guide/how-to-make-the-most-of-your-appointment) | Appointment itinerary, health record, care-team messages | Put upcoming care and communication on the home screen |
| [Mayo Clinic messaging](https://connect.mayoclinic.org/blog/chest-surgery/newsfeed-post/how-to-connect-with-your-care-team/) | Signed-in access to private care-team conversations | Account-based conversations with restricted recipients |
| [MyChart Care Companion](https://www.mychart.org/l/en-us/features/view-medications-test-results-bills/) | Care plans, health tracking, reminders, check-ins | Due-dated follow-up tasks with completion tracking |
| [NHS App features](https://digital.nhs.uk/services/nhs-app/nhs-app-features) | Records, appointments, messages, prescriptions, family access | Consistent patient access to records and next actions |
| [Practo](https://www.practo.com/doctors) | Finding doctors, appointments, medical records | Make booking and stored information part of the same patient journey |

## Delivered in the working application

- Durable accounts, patient profiles, readings, allergy/history notes, medication lists, appointment requests, and calendar/CSV/print exports.
- Patient/addressed-doctor conversations with saved replies, unread indicators, and paginated message history. Administrators retain explicit access; other doctors cannot read the thread.
- Follow-up tasks with personal/care-team source, due date, overdue display, completion, cancellation, reopening, and stale-update protection.
- A care overview showing upcoming visits, unread conversations, and patient tasks. Empty states direct users to create a profile or contact their administrator.
- Blank measurement inputs, so example values cannot be mistaken for measurements.
- Normal care mode by default. Synthetic seeding, simulations, and benchmark APIs require explicitly enabled practice mode; the original computing laboratory remains available for coursework.

Messages stay in the portal. Refresh checks for replies; background email/SMS/push is not enabled. Tasks are displayed when signed in rather than promising background reminder delivery. Appointment requests still require staff confirmation and do not imply a doctor's available time slots.

## Next integrations, in priority order

| Addition | Benefit | What is required |
|---|---|---|
| Public hosting and tested backups | Continuous access and recoverable records | Java-capable host, HTTPS, persistent disk, operator account, backup destination |
| Account verification and password recovery | Patients regain access without admin intervention | Email provider, verified sending domain, expiring single-use tokens and abuse controls |
| Provider onboarding and clinic settings | Actual clinicians can participate | Named clinic/operator and verified staff provisioning; membership model if multiple clinics |
| Doctor availability and rescheduling | Patients select real available slots | Staff schedules, clinic timezone, holidays, cancellation policy, atomic booking |
| Email/SMS reminders | Updates reach patients outside the site | Delivery-provider credentials, user opt-in, queue/retry handling, delivery records |
| Lab/document uploads | Keep reports alongside readings | Private file storage, file validation/scanning, size limits, access-controlled downloads |
| Medication renewal requests | Track questions about existing prescriptions | Verified prescribers and review workflow; pharmacy integration for actual dispensing |
| Family/carer access | Assist dependants without sharing passwords | Explicit grants, consent/revocation, identity checks and access audit |
| Video consultation | Support remote visits | Provider accounts, visit-specific access links, meeting service and staff availability |

These are operating/integration requirements, not buttons that imply working external services. No payments, pharmacy delivery, connected device monitoring, automated diagnosis, or emergency dispatch is represented as active.

## Operating scope

The application currently uses one Java process with durable embedded H2 storage; MySQL is not required. Its care organization and communication workflows are functional. Automated risk scoring remains a simplified, unvalidated teaching feature. Before a clinic uses the system for care, the operator needs provider onboarding, access/audit policy, verified account recovery, backups, and a privacy/security/clinical review appropriate to its users and jurisdiction. The current source code is not a claim of medical certification or production clinical readiness.
