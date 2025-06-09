package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.ChatDisplayNameDTO;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Service.ChatDisplayNameService;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatName")
@RequiredArgsConstructor
public class ChatNameController {
    private final ChatDisplayNameService chatDisplayNameService;
    private final ChatService chatService;

    @GetMapping("/fetchChatName/{userId}/chat/{chatId}")
    public ResponseEntity<ChatDisplayNameDTO> fetchChatName(
            @PathVariable("userId")String userId,
            @PathVariable("chatId")String chatId
    ){
        ChatDisplayNameDTO  chatName = this.chatDisplayNameService.fetchChatName(chatId,userId);
        ChatDTO  fetchChat =  chatService.fetchUserChat(chatId);
        if(fetchChat.getChatType() == ChatType.GROUP){
            throw  new IllegalArgumentException("");
        }
        return ResponseEntity.ok(chatName);
    }
}
