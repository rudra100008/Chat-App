package com.ChatApplication.Entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;
import java.time.LocalDateTime;

@Document(collection = "Message")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Message {
    @MongoId
    private String messageId;
    private String content;
    private LocalDateTime timestamp;
    private boolean isRead;
    @DBRef
    private User sender;
    @DBRef
    private Chat chat;


}
