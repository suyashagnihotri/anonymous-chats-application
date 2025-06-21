package com.chatapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class DatabaseService {
    
    @Value("${spring.datasource.url}")
    private String databaseUrl;
    
    @Value("${spring.datasource.username}")
    private String databaseUsername;
    
    @Value("${spring.datasource.password}")
    private String databasePassword;

    public Connection getConnection() throws SQLException {
        try {
            Class.forName("org.postgresql.Driver");
            return DriverManager.getConnection(databaseUrl, databaseUsername, databasePassword);
        } catch (ClassNotFoundException e) {
            throw new SQLException("PostgreSQL driver not found", e);
        }
    }

    public void initializeDatabase() {
        System.out.println("🗄️ Initializing database...");
        
        String createUsersTable = """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                is_anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;
        
        String createMessagesTable = """
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;
        
        String createIndexes = """
            CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
            CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
        """;
        
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            
            stmt.execute(createUsersTable);
            stmt.execute(createMessagesTable);
            stmt.execute(createIndexes);
            
            System.out.println("✅ Database initialized successfully");
            
        } catch (SQLException e) {
            System.err.println("❌ Error initializing database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void saveMessage(String id, String username, String content, boolean isAnonymous) {
        String sql = "INSERT INTO messages (id, username, content, timestamp, is_anonymous) VALUES (?, ?, ?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, id);
            stmt.setString(2, username);
            stmt.setString(3, content);
            stmt.setTimestamp(4, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setBoolean(5, isAnonymous);
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("💾 Message saved: " + id);
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error saving message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getRecentMessages(int limit) {
        String sql = "SELECT id, username, content, timestamp, is_anonymous FROM messages ORDER BY timestamp DESC LIMIT ?";
        List<Map<String, Object>> messages = new ArrayList<>();
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, limit);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> message = new HashMap<>();
                message.put("id", rs.getString("id"));
                message.put("username", rs.getString("username"));
                message.put("content", rs.getString("content"));
                message.put("timestamp", rs.getTimestamp("timestamp").toLocalDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                message.put("isAnonymous", rs.getBoolean("is_anonymous"));
                messages.add(message);
            }
            
            // Reverse to get chronological order
            java.util.Collections.reverse(messages);
            
        } catch (SQLException e) {
            System.err.println("❌ Error fetching messages: " + e.getMessage());
            e.printStackTrace();
        }
        
        return messages;
    }

    public void saveUser(String id, String username, boolean isAnonymous) {
        String sql = """
            INSERT INTO users (id, username, is_anonymous, created_at, last_active) 
            VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT (username) 
            DO UPDATE SET last_active = EXCLUDED.last_active
        """;
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            Timestamp now = Timestamp.valueOf(LocalDateTime.now());
            stmt.setString(1, id);
            stmt.setString(2, username);
            stmt.setBoolean(3, isAnonymous);
            stmt.setTimestamp(4, now);
            stmt.setTimestamp(5, now);
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("👤 User saved: " + username);
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error saving user: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void updateUserActivity(String username) {
        String sql = "UPDATE users SET last_active = ? WHERE username = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setString(2, username);
            
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            System.err.println("❌ Error updating user activity: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getActiveUsers(int minutesThreshold) {
        String sql = """
            SELECT id, username, is_anonymous, last_active 
            FROM users 
            WHERE last_active > ? 
            ORDER BY last_active DESC
        """;
        
        List<Map<String, Object>> users = new ArrayList<>();
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(minutesThreshold);
            stmt.setTimestamp(1, Timestamp.valueOf(threshold));
            
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> user = new HashMap<>();
                user.put("id", rs.getString("id"));
                user.put("username", rs.getString("username"));
                user.put("isAnonymous", rs.getBoolean("is_anonymous"));
                user.put("lastActive", rs.getTimestamp("last_active").toLocalDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                users.add(user);
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error fetching active users: " + e.getMessage());
            e.printStackTrace();
        }
        
        return users;
    }

    public void cleanupOldMessages(int daysToKeep) {
        String sql = "DELETE FROM messages WHERE created_at < ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            LocalDateTime cutoff = LocalDateTime.now().minusDays(daysToKeep);
            stmt.setTimestamp(1, Timestamp.valueOf(cutoff));
            
            int deletedRows = stmt.executeUpdate();
            System.out.println("🧹 Cleaned up " + deletedRows + " old messages");
            
        } catch (SQLException e) {
            System.err.println("❌ Error cleaning up old messages: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
