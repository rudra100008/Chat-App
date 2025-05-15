package com.ChatApplication.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDisplayNameDTO {
    private String id;
    private String chatname;
    private String userId;
    private String chatId;
}
