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
    public ResponseEntity<?> createChat(@RequestBody List<Integer> participantsIds){
        ChatDTO chatDTO = this.chatService.createChat(participantsIds);
        return new ResponseEntity<>(chatDTO, HttpStatus.OK);
    }

}
