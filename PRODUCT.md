# SmartHealth academic workspace

The rebuilt project implements the supplied CAPP healthcare brief with a real Java/Spring Boot API and embedded H2 persistence, retaining the original SmartHealth visual identity. MySQL is no longer required, following the user's updated preference.

Patients own one profile and see only their own health information. Doctors see patient records and respond to alerts. Administrators manage patients and doctor access. Doctors and administrators can run measured sequential/parallel experiments on synthetic datasets.
Patients and staff can maintain a care record, review medication instructions, print a summary, and request/manage appointments. Appointment requests are distinct from confirmed visits and do not imply integration with a real clinic.

The application must never substitute invented benchmark timings or browser-only data for a failed backend response. Charts begin empty and are populated from saved readings and measured experiments. Simulation is clearly labeled and uses the same analyzer and persistence path as entered readings.

Keep the original artwork, grayscale/glass surfaces, serif headings, navigation, reduced-motion behavior, and restrained animation. Added workflows should use these existing design tokens and remain usable on small screens.

This is a college demonstration for SDG 3, not clinical software. See README and docs for setup, scope, and verification.
