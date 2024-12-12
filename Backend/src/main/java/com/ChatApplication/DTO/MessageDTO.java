package com.ChatApplication.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {
    private String messageId;
    @NotBlank
    private String content;
    private LocalDateTime timestamp;
    @NotBlank
    private String senderId;
    @NotBlank
    private String  chatId;
}
