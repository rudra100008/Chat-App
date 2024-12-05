package com.ChatApplication.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {
    private int messageId;
    private String content;
    private Timestamp timestamp;

    private int senderId;
    private int  chatId;
}
