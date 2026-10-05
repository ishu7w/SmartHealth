# Deployment without MySQL

SmartHealth now defaults to an embedded H2 database. The Java process serves the built React UI and the API on one origin. A separate database service is not required.

## Local start

```sh
export ADMIN_EMAIL='your-email@example.com'
export ADMIN_PASSWORD='your-unique-password-at-least-12-characters'
export DATABASE_PASSWORD='your-separate-database-password'
export DATA_DIR="$PWD/local-health-data"
sh scripts/build.sh
java -jar backend/target/smarthealth-2.0.0.jar
```

Open http://localhost:8080. Keep `DATA_DIR` the same between starts. For the original development workflow, run Vite on port 5173 alongside the backend. Neither mode silently falls back to fake data.

## Docker

Copy `.env.example` to `.env`, replace the values, and run `docker compose up --build`. The `health-data` volume preserves the embedded database. The service binds to localhost by default. A reverse proxy is required to expose it publicly with TLS.

## Existing Java/Docker host

1. Deploy the Docker image or executable JAR.
2. Attach a persistent writable directory at `/app/data` (or use the host's mount path as `DATA_DIR`).
3. Set `SPRING_PROFILES_ACTIVE=hosted`, `DATA_DIR`, `DATABASE_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the host's secret settings. No secrets go into Git.
4. Expose the service through HTTPS. The hosted profile uses secure, HttpOnly session cookies. Keep the frontend and API on the same origin.
5. Keep `PRACTICE_TOOLS=false` for normal care use. Health-check `/api/health`. Only declare the deployment ready after patient/staff records, messages, tasks, appointment workflows, and a restart/persistence check pass.

Use **one application instance** with this embedded file database. Do not attach the same H2 file to multiple independently running JVMs or put it on an ephemeral serverless filesystem. Sessions expire on restart and require signing in again; records persist.

## Optional Render blueprint

`render.yaml` is a ready deployment configuration for one Docker service with a 1 GB persistent disk and manual deploys. It requires the account owner to choose the repository/branch and supply the administrator credentials. Activating the configured service/disk incurs hosting charges; the configuration alone does not create a service or incur charges.

Render's [persistent-disk documentation](https://render.com/docs/disks) says disks require a paid service. Its [Blueprint reference](https://render.com/docs/blueprint-spec) documents the configuration format. No public deployment should use the free ephemeral disk for records that must survive a redeploy.

## Backups and upgrades

Before an upgrade, stop the application gracefully and back up the entire data directory and its configured database password through the host's backup facility. Do not copy an actively written H2 file as a presumed consistent backup. Test restoration on a separate application instance with a copied directory before depending on it. Retain old backups until the new version is verified. Keep database and application access limited to the host owner.

The classroom application uses JPA schema updates. Validate upgrades against a copy of the database before changing a long-lived hosted instance. A host snapshot should include the persistent disk, not only the executable image.

## Public deployment status

The hosting provider/project has not yet been identified in this task. No public URL or live verification is claimed until the owner connects the chosen Java-capable host. Existing Vercel static hosting cannot supply a durable Java runtime or this file database.
