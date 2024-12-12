package com.ChatApplication.Controller;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/messages")
public class MessageController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO messageDTO)throws ResourceNotFoundException {
        MessageDTO savedMessage = messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );

        messagingTemplate.convertAndSend("/topic/chat/"+savedMessage.getChatId(),savedMessage);
    }

    @PostMapping
    public ResponseEntity<MessageDTO> postMessage(@Valid @RequestBody MessageDTO messageDTO){
        MessageDTO savedMessage = this.messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<List<MessageDTO>> fetchMessageBySenderId(@PathVariable("senderId")String senderId){
        List<MessageDTO> messageDTO = this.messageService.fetchMessagesBySenderId(senderId);
        return ResponseEntity.ok(messageDTO);
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<MessageDTO>> fetchMessageByChatId(@PathVariable("chatId")String chatId){
        List<MessageDTO> messageDTO = this.messageService.fetchMessagesByChatId(chatId);
        return ResponseEntity.ok(messageDTO);
    }

    @PatchMapping("/{messageId}")
    public ResponseEntity<?> updateMessages(
            @PathVariable("messageId")String messageId,
            @Valid @RequestBody MessageDTO messageDTO,
            BindingResult result
    ){
        if (result.hasErrors()){
            Map<String,Object> error = new HashMap<>();
            result.getFieldErrors().stream().map(fieldError -> error.put(fieldError.getField(),fieldError.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        MessageDTO updateMessages = this.messageService.updateMessage(
                messageId,
                messageDTO.getContent()
        );
        return ResponseEntity.ok(updateMessages);
    }

    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<String> deleteMessage(@PathVariable("messageId")String messageId){
        this.messageService.deleteMessage(messageId);
        return ResponseEntity.ok("Message Deleted.");
    }


}
