package com.ChatApplication.Entity;


import com.ChatApplication.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "User")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
  @MongoId
    private String user_Id;
    private String userName;
    private String email;
    private String password;
    private String profile_picture;
    private String phoneNumber;
    private UserStatus status;
    private LocalDateTime last_seen;

    //this is owned by the field sender in the Message class
   @DBRef
    private List<Message> message;
    //this is owned by the field participants in the Chat class
    @DBRef
    private List<Chat> chat;
}
