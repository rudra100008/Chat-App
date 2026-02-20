package com.ChatApplication.DTO;


import com.ChatApplication.Enum.ChatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatDTO {
    private String chatId;
    private String chatName;

    private String chatImageUrl;
    private String publicId; // only for GROUP chat
    private String secureUrl; // only for GROUP chat

    private ChatType chatType; // GROUP,SINGLE
    @Builder.Default
    private List<String> participantIds =  new ArrayList<>();
    private LocalDateTime createdAt;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private List<String> adminIds;// for group chat
    private List<String> blockedBy; // for single chat

}
