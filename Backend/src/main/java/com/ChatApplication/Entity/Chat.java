package com.ChatApplication.Entity;


import com.ChatApplication.Enum.ChatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "Chat")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Chat {
    @MongoId
    private String chatId;
    private String  chatName;//only for GROUP chat
    private String chatImageUrl; // only for GROUP chat
    private ChatType chatType; //SINGLE,GROUP
    private List<User> participants;
    private LocalDateTime createdAt;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private List<String> adminIds;// for group chat
    private List<String> blockedBy; // for single chat

}