package com.ChatApplication.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatName {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String chatName;

    @ManyToOne
    @JoinColumn(name = "user_Id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "chat_Id")
    private Chat chat;
}
