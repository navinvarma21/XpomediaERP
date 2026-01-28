package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.BankAccountDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.BankAccount;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BankAccountService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        String sql = "CREATE TABLE IF NOT EXISTS bank_accounts (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bank_name VARCHAR(255), " +
                "account_name VARCHAR(255), " +
                "account_number VARCHAR(50), " +
                "ifsc_code VARCHAR(50), " +
                "branch_name VARCHAR(100), " +
                "account_type VARCHAR(50), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20)" +
                ")";
        jdbc.execute(sql);
    }

    public List<BankAccount> getAllAccounts(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM bank_accounts", new BeanPropertyRowMapper<>(BankAccount.class));
    }

    public void saveAccount(String schoolId, BankAccountDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "INSERT INTO bank_accounts (bank_name, account_name, account_number, ifsc_code, branch_name, account_type, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?)";
        jdbc.update(sql,
                dto.getBankName(),
                dto.getAccountName(),
                dto.getAccountNumber(),
                dto.getIfscCode(),
                dto.getBranchName(),
                dto.getAccountType(),
                schoolId,
                dto.getAcademicYear()
        );
    }

    public void updateAccount(String schoolId, Long id, BankAccountDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "UPDATE bank_accounts SET bank_name=?, account_name=?, account_number=?, ifsc_code=?, branch_name=?, account_type=? WHERE id=?";
        jdbc.update(sql,
                dto.getBankName(),
                dto.getAccountName(),
                dto.getAccountNumber(),
                dto.getIfscCode(),
                dto.getBranchName(),
                dto.getAccountType(),
                id
        );
    }

    public void deleteAccount(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        jdbc.update("DELETE FROM bank_accounts WHERE id = ?", id);
    }
}