package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/{chatId}")
    public ResponseEntity<?> fetchParticipantsInChat(@PathVariable("chatId") String chatId){
        List<UserDTO> fetchedUser = this.chatService.fetchChatParticipants(chatId);
        return ResponseEntity.ok(fetchedUser);
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> fetchUserInChat(@PathVariable("userId") String userId){
        List<ChatDTO> fetchedChats = this.chatService.fetchUserChats(userId);
        return ResponseEntity.ok(fetchedChats);
    }

    @PatchMapping("/{chatId}/user/{userId}")
    public ResponseEntity<?> addParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId") String userId
    ){
        ChatDTO updatedChat = this.chatService.addParticipants(chatId,userId);
        return ResponseEntity.ok(updatedChat);
    }

    @GetMapping("/checkParticipants/{chatId}/user/{userId}")
    public ResponseEntity<?> checkParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId")String userId
    ){
        Map<String,Object> response = new HashMap<>();
        Boolean isInChat = this.chatService.isUserInChat(chatId,userId);
        response.put("isInChat",isInChat);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/deleteParticipants/{chatId}/user/{userId}")
    public ResponseEntity<?> removeParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId")String userId
    ){
        ChatDTO chatDTO = this.chatService.deleteParticipants(chatId,userId);
        return ResponseEntity.ok(chatDTO);
    }

}
