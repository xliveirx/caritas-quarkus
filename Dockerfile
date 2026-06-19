FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/quarkus-app ./quarkus-app
RUN openssl genrsa -out privateKey.pem 2048 && \
    openssl rsa -in privateKey.pem -pubout -out publicKey.pem
EXPOSE 8080
CMD ["java", "-jar", "quarkus-app/quarkus-run.jar"]