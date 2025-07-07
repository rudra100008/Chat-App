package com.ChatApplication.Entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Builder
@NoArgsConstructor
@Data
public class MessageRead {
    private String messageId;
    private String chatId;
    private String readerId;
}
