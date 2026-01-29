package com.backend.school_erp.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class DatabaseConfig {
    // UPDATED: Mumbai RDS Connection Constants (ap-south-1)
    public static final String AWS_DB_BASE_URL = "jdbc:mysql://xpomedia-db.cz0akso48444.ap-south-1.rds.amazonaws.com:3306/";
    public static final String AWS_DB_USER = "admin";
    
    // UPDATED: The password you confirmed for the Mumbai instance
    public static final String AWS_DB_PASS = "xpomedia-db"; 
    
    public static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    // Default URL params (SSL, Timezone, etc.)
    public static final String DB_PARAMS = "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
}
