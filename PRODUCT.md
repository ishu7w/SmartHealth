# SmartHealth patient and care-team workspace

The rebuilt project implements the supplied CAPP healthcare brief with a real Java/Spring Boot API and embedded H2 persistence, retaining the original SmartHealth visual identity. MySQL is no longer required, following the user's updated preference.

Patients own one profile and see only their own health information. Doctors see patient records and respond to alerts. Administrators manage patients and doctor access. Doctors and administrators can run measured sequential/parallel experiments on synthetic datasets only when practice tools are explicitly enabled.
Patients and staff can maintain a care record, review medication instructions, print a summary, and request/manage appointments. Appointment requests are distinct from confirmed visits and do not imply integration with a real clinic.

The application must never substitute invented benchmark timings or browser-only data for a failed backend response. Charts begin empty and are populated from saved readings and measured experiments. Simulation is clearly labeled and uses the same analyzer and persistence path as entered readings.

Keep the original artwork, grayscale/glass surfaces, serif headings, navigation, reduced-motion behavior, and restrained animation. Added workflows should use these existing design tokens and remain usable on small screens.

Conversations belong to the patient, addressed doctor, and administrators. Other doctors cannot access them. Follow-up tasks distinguish personal and care-team instructions. The default care overview prioritizes upcoming appointments, messages, and tasks. Measurements start blank. Normal mode disables synthetic seeding, simulation, and benchmark APIs.

The portal grew from an SDG 3 college project. Its organizational workflows persist user-entered records; automated risk scoring is still an unvalidated teaching feature. Public hosting, provider onboarding, account recovery, delivery services, and operational review are required before real clinical service. See README and docs for setup, scope, and verification.
