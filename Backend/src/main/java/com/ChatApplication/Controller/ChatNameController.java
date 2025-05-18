package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDisplayNameDTO;
import com.ChatApplication.Service.ChatDisplayNameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
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
    @PostMapping("/saveChatName/{chatName}/chat/{chatId}")
    public ResponseEntity<ChatDisplayNameDTO> saveChatName(
            @PathVariable("chatName")String chatName,
            @PathVariable("chatId")String chatId
    ){
        ChatDisplayNameDTO chatDisplayNameDTO = this.chatDisplayNameService.saveChatName(chatId,chatName);
        return ResponseEntity.ok(chatDisplayNameDTO);
    }
}
