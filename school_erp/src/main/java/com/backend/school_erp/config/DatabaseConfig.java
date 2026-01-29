package com.backend.school_erp.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseConfig {
    // Corrected Mumbai RDS URL (ap-south-1)
    public static final String AWS_DB_BASE_URL = "jdbc:mysql://xpomedia-db.cz0akso48444.ap-south-1.rds.amazonaws.com:3306/";
    public static final String AWS_DB_USER = "admin";
    public static final String AWS_DB_PASS = "xpomedia-db"; // Matches your RDS password
    public static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    // Required parameters to prevent connection errors
    public static final String DB_PARAMS = "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
}
