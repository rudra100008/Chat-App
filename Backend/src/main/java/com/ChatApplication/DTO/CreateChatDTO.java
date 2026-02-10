package com.ChatApplication.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateChatDTO(
        String chatName,
        @NotBlank(message = "Phone number cannot be blank")
        @Pattern(
                regexp = "^(98|97)\\d{8}$",
                message = "Invalid  mobile number"
        )
        String phoneNumber
) {
}
