package com.ChatApplication.Entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Document(collection = "chatName")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatName {
   @MongoId
    private String id;

    private String chatName;
    @DBRef
    private User user;
    @DBRef
    private Chat chat;
}
