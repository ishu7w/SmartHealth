FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./pom.xml
RUN mvn -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist ./src/main/resources/static
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S smarthealth && adduser -S smarthealth -G smarthealth
WORKDIR /app
COPY --from=backend --chown=smarthealth:smarthealth /app/target/smarthealth-2.0.0.jar app.jar
RUN mkdir -p /app/data && chown smarthealth:smarthealth /app/data
USER smarthealth
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
