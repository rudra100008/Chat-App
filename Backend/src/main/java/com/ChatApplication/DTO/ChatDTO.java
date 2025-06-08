package com.ChatApplication.DTO;


import com.ChatApplication.Enum.ChatType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDTO {
    private String chatId;
    private String chatName;
    private String chatImageUrl;
    private ChatType chatType; // GROUP,SINGLE
    private List<String> participantIds =  new ArrayList<>();
    private LocalDateTime createdAt;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private List<String> adminIds;// for group chat
    private List<String> blockedBy; // for single chat

}
