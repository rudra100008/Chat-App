package com.ChatApplication.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int user_Id;
    private String userName;
    private String email;
    private String password;
    private String profile_picture;
    private String phoneNumber;
    private UserStatus status;
    private LocalDateTime last_seen;

    //this is owned by the field sender in the Message class
    @OneToMany(mappedBy = "sender",cascade = CascadeType.ALL)
    private List<Message> message;
    //this is owned by the field participants in the Chat class
    @ManyToMany(mappedBy = "participants",cascade = CascadeType.ALL)
    private List<Chat> chat;
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL)
    private List<ChatName> chatNames;
}
