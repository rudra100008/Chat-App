package com.ChatApplication.Entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Document(collection = "chatName")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDisplayName {
   @MongoId
    private String id;
    private String chatname;
    private String userId;
    private String chatId;
}
