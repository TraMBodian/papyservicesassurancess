# ── Build stage ───────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY backend/pom.xml .
RUN mvn dependency:go-offline -q

COPY backend/src ./src
RUN mvn package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java \
  -Dfile.encoding=UTF-8 \
  -Dspring.profiles.active=${SPRING_PROFILE:-postgres} \
  -Dspring.datasource.url=jdbc:postgresql://${PGHOST:-localhost}:${PGPORT:-5432}/${PGDATABASE:-assurance_db} \
  -Dspring.datasource.username=${PGUSER:-admin} \
  -Dspring.datasource.password=${PGPASSWORD:-admin123} \
  -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
  -jar app.jar \
  --server.port=${PORT:-8080}"]
