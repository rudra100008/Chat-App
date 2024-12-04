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
    private int chatId;
    private String chatName;
    private List<Integer> participants =  new ArrayList<>();
    private List<Integer> messages = new ArrayList<>();
}
