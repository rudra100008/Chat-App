package com.ChatApplication.DTO;

import com.ChatApplication.Entity.Attachment;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageDTO {
    private String messageId;
    @NotEmpty(message = "content cannot be empty")
    private String content;
    private LocalDateTime timestamp;
    private boolean isRead;
    @NotEmpty(message = "SenderId cannot be empty")
    private String senderId;
    @NotEmpty(message = "ChatId cannot be empty")
    private String  chatId;

    private Attachment attachment;
}
