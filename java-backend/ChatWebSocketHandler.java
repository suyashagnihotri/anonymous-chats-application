package com.chatapp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {
    
    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private static final Map<String, User> sessionUsers = new ConcurrentHashMap<>();
    private static final List<User> onlineUsers = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private DatabaseService databaseService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("🔗 New WebSocket connection established: " + session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        String payload = message.getPayload().toString();
        System.out.println("📨 Received message: " + payload);
        
        try {
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.get("type");
            
            switch (type) {
                case "user_join":
                    handleUserJoin(session, data);
                    break;
                case "message":
                    handleChatMessage(session, data);
                    break;
                case "user_leave":
                    handleUserLeave(session);
                    break;
                case "typing_start":
                    handleTypingStart(session, data);
                    break;
                case "typing_stop":
                    handleTypingStop(session, data);
                    break;
                default:
                    System.out.println("⚠️ Unknown message type: " + type);
            }
        } catch (Exception e) {
            System.err.println("❌ Error handling message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void handleUserJoin(WebSocketSession session, Map<String, Object> data) throws IOException {
        Map<String, Object> userData = (Map<String, Object>) data.get("user");
        User user = new User(
            (String) userData.get("id"),
            (String) userData.get("username"),
            (Boolean) userData.get("isAnonymous")
        );
        
        sessionUsers.put(session.getId(), user);
        onlineUsers.add(user);
        
        // Save user to database
        databaseService.saveUser(user.getId(), user.getUsername(), user.isAnonymous());
        
        System.out.println("👤 User joined: " + user.getUsername() + " (Anonymous: " + user.isAnonymous() + ")");
        
        // Notify all users about new user
        Map<String, Object> response = Map.of(
            "type", "user_joined",
            "username", user.getUsername(),
            "users", onlineUsers,
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
        
        broadcastMessage(objectMapper.writeValueAsString(response));
        
        // Send recent messages to new user
        sendRecentMessages(session);
    }

    private void handleChatMessage(WebSocketSession session, Map<String, Object> data) throws IOException {
        Map<String, Object> messageData = (Map<String, Object>) data.get("message");
        User sender = sessionUsers.get(session.getId());
        
        if (sender == null) {
            System.err.println("❌ Message from unknown user");
            return;
        }
        
        // Save message to database
        String messageId = (String) messageData.get("id");
        String content = (String) messageData.get("content");
        String timestamp = (String) messageData.get("timestamp");
        
        databaseService.saveMessage(messageId, sender.getUsername(), content, sender.isAnonymous());
        
        System.out.println("💬 Message from " + sender.getUsername() + ": " + content);
        
        // Broadcast message to all connected clients
        Map<String, Object> response = Map.of(
            "type", "message",
            "message", messageData
        );
        
        broadcastMessage(objectMapper.writeValueAsString(response));
    }

    private void handleUserLeave(WebSocketSession session) throws IOException {
        User user = sessionUsers.get(session.getId());
        if (user != null) {
            onlineUsers.remove(user);
            sessionUsers.remove(session.getId());
            
            System.out.println("👋 User left: " + user.getUsername());
            
            Map<String, Object> response = Map.of(
                "type", "user_left",
                "username", user.getUsername(),
                "users", onlineUsers,
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            
            broadcastMessage(objectMapper.writeValueAsString(response));
        }
        sessions.remove(session.getId());
    }

    private void handleTypingStart(WebSocketSession session, Map<String, Object> data) throws IOException {
        User user = sessionUsers.get(session.getId());
        if (user != null) {
            Map<String, Object> response = Map.of(
                "type", "typing_start",
                "username", user.getUsername(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            
            broadcastMessageExcept(objectMapper.writeValueAsString(response), session);
        }
    }

    private void handleTypingStop(WebSocketSession session, Map<String, Object> data) throws IOException {
        User user = sessionUsers.get(session.getId());
        if (user != null) {
            Map<String, Object> response = Map.of(
                "type", "typing_stop",
                "username", user.getUsername(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            
            broadcastMessageExcept(objectMapper.writeValueAsString(response), session);
        }
    }

    private void sendRecentMessages(WebSocketSession session) throws IOException {
        List<Map<String, Object>> recentMessages = databaseService.getRecentMessages(50);
        
        Map<String, Object> response = Map.of(
            "type", "message_history",
            "messages", recentMessages
        );
        
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
        }
    }

    private void broadcastMessage(String message) {
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                System.err.println("❌ Error broadcasting message: " + e.getMessage());
            }
        });
    }

    private void broadcastMessageExcept(String message, WebSocketSession excludeSession) {
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen() && !session.equals(excludeSession)) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                System.err.println("❌ Error broadcasting message: " + e.getMessage());
            }
        });
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("🚨 Transport error for session " + session.getId() + ": " + exception.getMessage());
        handleUserLeave(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        System.out.println("🔌 Connection closed: " + session.getId() + " - " + closeStatus.toString());
        handleUserLeave(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    // User class
    public static class User {
        private String id;
        private String username;
        private boolean isAnonymous;
        private LocalDateTime joinTime;

        public User(String id, String username, boolean isAnonymous) {
            this.id = id;
            this.username = username;
            this.isAnonymous = isAnonymous;
            this.joinTime = LocalDateTime.now();
        }

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public boolean isAnonymous() { return isAnonymous; }
        public void setAnonymous(boolean anonymous) { isAnonymous = anonymous; }
        
        public LocalDateTime getJoinTime() { return joinTime; }
        public void setJoinTime(LocalDateTime joinTime) { this.joinTime = joinTime; }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            User user = (User) obj;
            return id.equals(user.id);
        }

        @Override
        public int hashCode() {
            return id.hashCode();
        }

        @Override
        public String toString() {
            return "User{id='" + id + "', username='" + username + "', isAnonymous=" + isAnonymous + "}";
        }
    }
}
