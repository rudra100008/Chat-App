package com.ChatApplication.Controller;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class MessageController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO messageDTO) {
        MessageDTO savedMessage = messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );

        messagingTemplate.convertAndSend("/topic/chat/"+savedMessage.getChatId(),savedMessage);
    }

    @PostMapping("/messages")
    public ResponseEntity<?> getMessage(@RequestBody MessageDTO messageDTO){
        MessageDTO savedMessage = this.messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );
        return ResponseEntity.ok(savedMessage);
    }


}
