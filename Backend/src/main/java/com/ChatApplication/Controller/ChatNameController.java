package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDisplayNameDTO;
import com.ChatApplication.Service.ChatDisplayNameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatName")
@RequiredArgsConstructor
public class ChatNameController {
    private final ChatDisplayNameService chatDisplayNameService;

    @GetMapping("/fetchChatName/{userId}/chat/{chatId}")
    public ResponseEntity<ChatDisplayNameDTO> fetchChatName(
            @PathVariable("userId")String userId,
            @PathVariable("chatId")String chatId
    ){
        ChatDisplayNameDTO  chatName = this.chatDisplayNameService.fetchChatName(chatId,userId);
        return ResponseEntity.ok(chatName);
    }
}
