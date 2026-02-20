package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.ChatDisplayNameDTO;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Service.ChatDisplayNameService;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
        ChatDTO  fetchChat =  chatService.fetchChatById(chatId);
        if(fetchChat.getChatType() == ChatType.GROUP){
            throw  new IllegalArgumentException(fetchChat.getChatId() + " is GROUP chat");
        }
        return ResponseEntity.ok(chatName);
    }

    @PutMapping("/updateChatName/{userId}/chat/{chatId}")
    public ResponseEntity<?> updateChatName(
            @PathVariable("userId")String userId,
            @PathVariable("chatId")String chatId,
            @RequestParam("chatName")String chatName
    ){
        ChatDisplayNameDTO chatDisplayNameDTO = this.chatDisplayNameService.saveChatName(chatId,chatName,userId);
        ChatDTO  fetchChat =  chatService.fetchChatById(chatId);
        if(fetchChat.getChatType() == ChatType.GROUP){
            throw  new IllegalArgumentException("Group chat has no chatName.");
        }
        return ResponseEntity.ok(chatDisplayNameDTO);
    }
}
