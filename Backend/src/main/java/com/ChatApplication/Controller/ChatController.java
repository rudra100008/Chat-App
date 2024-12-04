package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    @PostMapping
    public ResponseEntity<?> createChat(@RequestBody ChatDTO chatDTO){
        ChatDTO savedChat = this.chatService.createChat(chatDTO);
        return new ResponseEntity<>(savedChat, HttpStatus.OK);
    }
    @PostMapping("/groupChat")
    public ResponseEntity<?> createGroupChat(@RequestBody ChatDTO chatDTO){
        ChatDTO savedGroupChat = this.chatService.createGroupChat(chatDTO);
        return ResponseEntity.ok(savedGroupChat);
    }

}
