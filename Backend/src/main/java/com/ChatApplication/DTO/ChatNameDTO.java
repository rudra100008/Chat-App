package com.ChatApplication.DTO;

import com.ChatApplication.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatNameDTO {
    private String id;
    private String chatName;

    private String user;
}
