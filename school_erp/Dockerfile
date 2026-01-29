FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Create the certs directory and copy the bundle from your EC2 to the image
RUN mkdir /certs
COPY global-bundle.pem /certs/global-bundle.pem 
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
