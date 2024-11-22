package com.ChatApplication.DTO;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {
    private int message_Id;
    private String content;
    private Timestamp timestamp;

    private User sender;
    private Chat chat;
}
