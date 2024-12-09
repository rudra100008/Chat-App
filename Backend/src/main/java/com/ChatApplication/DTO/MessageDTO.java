package com.ChatApplication.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {
    private String messageId;
    private String content;
    private LocalDateTime timestamp;

    private String senderId;
    private String  chatId;
}
