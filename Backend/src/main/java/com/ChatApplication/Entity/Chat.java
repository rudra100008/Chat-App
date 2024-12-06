package com.ChatApplication.Entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.List;

@Document(collection = "Chat")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Chat {
    @MongoId
    private String chatId;
    private String chatName;

    @DBRef
    private List<User> participants;

    @DBRef
    private List<Message> messages;
}
