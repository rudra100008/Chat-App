package com.ChatApplication.TwoFactorAuth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TwoFactorResponse {
    private String userId;
    private String phoneNumber;
    private boolean phoneVerified;
    private LocalDateTime phoneVerifiedAt;
    private boolean twoFactorEnabled;
    private String message;
}
