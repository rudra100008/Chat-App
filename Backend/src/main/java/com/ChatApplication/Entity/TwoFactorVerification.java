package com.ChatApplication.Entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorVerification {
    @NotBlank(message = "Phone number cannot be blank")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String phoneNumber;
    @NotBlank(message = "Verification code cannot be blank")
    @Pattern(regexp = "^[0-9]{6}$", message = "Verification code must be 6 digits")
    private String verificationCode;
}
