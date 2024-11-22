package com.ChatApplication.DTO;

import com.ChatApplication.Entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private int userId;
    private String user_name;
    private String email;
    private String password;
    private String profile_picture;
    private String phone_number;
    private UserStatus status;
    private LocalDateTime last_seen;
}
