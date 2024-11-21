package com.ChatApplication.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    private int userId;
    private String user_name;
    private String profile_picture;
    private String phone_number;
    private UserStatus status;
    private LocalDateTime last_seen;
}
