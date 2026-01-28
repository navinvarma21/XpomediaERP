package com.backend.school_erp.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class DatabaseConfig {
    // AWS RDS Connection Constants
    public static final String AWS_DB_BASE_URL = "jdbc:mysql://db-xpomedia-erp.c58yeuaqk5wm.ap-south-2.rds.amazonaws.com:3306/";
    public static final String AWS_DB_USER = "admin";
    public static final String AWS_DB_PASS = "mysqlxpo26";
    public static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    // Default URL params (SSL, Timezone, etc.)
    public static final String DB_PARAMS = "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
}