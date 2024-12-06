package com.ChatApplication.DTO;

import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDTO {
    private String chatId;
    private String chatName;
    private List<String> participants =  new ArrayList<>();
    private List<String> messages = new ArrayList<>();
}
