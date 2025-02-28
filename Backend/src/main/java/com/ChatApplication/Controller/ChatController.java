package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
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
    public ResponseEntity<ChatDTO> createChat(@RequestBody ChatDTO chatDTO){
        ChatDTO savedChat = this.chatService.createChat(chatDTO);
        return new ResponseEntity<>(savedChat, HttpStatus.OK);
    }
    @PostMapping("/groupChat")
    public ResponseEntity<ChatDTO> createGroupChat(@RequestBody ChatDTO chatDTO){
        ChatDTO savedGroupChat = this.chatService.createGroupChat(chatDTO);
        return ResponseEntity.ok(savedGroupChat);
    }

    //get all the participants in a chat
    @GetMapping("/{chatId}")
    public ResponseEntity<List<UserDTO>> fetchParticipantsInChat(@PathVariable("chatId") String chatId){
        List<UserDTO> fetchedUser = this.chatService.fetchChatParticipants(chatId);
        return ResponseEntity.ok(fetchedUser);
    }

    // get all the chat of the user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ChatDTO>> fetchUserChat(@PathVariable("userId") String userId){
        List<ChatDTO> fetchedChats = this.chatService.fetchUserChats(userId);
        return ResponseEntity.ok(fetchedChats);
    }

    //add Participants in the
    @PatchMapping("/{chatId}/user/{userId}")
    public ResponseEntity<ChatDTO> addParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId") String userId
    ){
        ChatDTO updatedChat = this.chatService.addParticipants(chatId,userId);
        return ResponseEntity.ok(updatedChat);
    }

    @GetMapping("/checkParticipants/{chatId}/user/{userId}")
    public ResponseEntity<Map<String,Boolean>> checkParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId")String userId
    ){
        Map<String,Boolean> response = new HashMap<>();
        Boolean isInChat = this.chatService.isUserInChat(chatId,userId);
        response.put("isInChat",isInChat);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/deleteParticipants/{chatId}/user/{userId}")
    public ResponseEntity<ChatDTO> removeParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId")String userId
    ){
        ChatDTO chatDTO = this.chatService.deleteParticipants(chatId,userId);
        return ResponseEntity.ok(chatDTO);
    }
    @DeleteMapping("/delete/{chatId}")
    public ResponseEntity<String> removeChat(
            @PathVariable("chatId")String chatId
    ){
        this.chatService.deleteChat(chatId);
        return  ResponseEntity.ok("Chat Deleted");
    }

    @GetMapping("/chatDetails/{chatId}")
    public ResponseEntity<?> getUserChat(
            @PathVariable("chatId")String chatId,
            StompHeaderAccessor headerAccessor
    )
    {
        ChatDTO chatDTO = this.chatService.fetchUserChat(chatId,headerAccessor);
        return ResponseEntity.ok(chatDTO);
    }

}
