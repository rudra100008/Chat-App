package com.ChatApplication.Controller;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.PageInfo;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {
    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthUtils authUtils;
    private static final String PAGE_NUMBER = "0";
    private static final String PAGE_SIZE =   "10";

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Valid @Payload MessageDTO messageDTO,
                            StompHeaderAccessor headerAccessor) throws ResourceNotFoundException {
        logger.debug("Message received from the client.");

        // Retrieve the authenticated user using AuthUtils
        User sender = authUtils.getLoggedInUserFromWebSocket(headerAccessor);

        // Ensure the sender ID in the message matches the authenticated user's ID
        if (!messageDTO.getSenderId().equals(sender.getUser_Id())) {
            logger.error("Sender ID mismatch");
            throw new AccessDeniedException("Sender ID does not match authenticated user");
        }

        // Proceed with posting the message
        MessageDTO savedMessage = messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );

        // Send the message to the appropriate chat
        messagingTemplate.convertAndSend("/private/chat/" + savedMessage.getChatId(), savedMessage);
    }


    @PostMapping
    public ResponseEntity<?> postMessage(
            @Valid @RequestBody MessageDTO messageDTO,
            BindingResult result
    )
    {
        if(result.hasErrors()){
            Map<String, Object> error = new HashMap<>();
            result.getFieldErrors().forEach(f-> error.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        MessageDTO savedMessage = this.messageService.postMessage(
                messageDTO.getSenderId(),
                messageDTO.getChatId(),
                messageDTO.getContent()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<PageInfo<MessageDTO>> fetchMessageBySenderId(
            @PathVariable("senderId")String senderId,
            @RequestParam(required = false, defaultValue = PAGE_NUMBER,name = "pageNumber")Integer pageNumber,
            @RequestParam(required = false,defaultValue = PAGE_SIZE,name = "pageSize")Integer pageSize
    )
    {
        PageInfo<MessageDTO> messageDTO = this.messageService.fetchMessagesBySenderId(senderId,pageNumber,pageSize);
        return ResponseEntity.ok(messageDTO);
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<PageInfo<MessageDTO>> fetchMessageByChatId(
            @PathVariable("chatId")String chatId,
            @RequestParam(required = false, defaultValue = PAGE_NUMBER,name = "pageNumber")Integer pageNumber,
            @RequestParam(required = false,defaultValue = PAGE_SIZE,name = "pageSize")Integer pageSize
    )
    {
        PageInfo<MessageDTO> messageDTO = this.messageService.fetchMessagesByChatId(chatId,pageNumber,pageSize);
        return ResponseEntity.ok(messageDTO);
    }

    @PatchMapping("/{messageId}")
    public ResponseEntity<?> updateMessages(
            @PathVariable("messageId")String messageId,
            @Valid @RequestBody MessageDTO messageDTO,
            BindingResult result
    )
    {
        if (result.hasErrors()){
            Map<String,Object> error = new HashMap<>();
            result.getFieldErrors().forEach(fieldError -> error.put(fieldError.getField(),fieldError.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        MessageDTO updateMessages = this.messageService.updateMessage(
                messageId,
                messageDTO.getContent()
        );
        return ResponseEntity.ok(updateMessages);
    }

    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<String> deleteMessage(@PathVariable("messageId")String messageId)
    {
        this.messageService.deleteMessage(messageId);
        return ResponseEntity.ok("Message Deleted.");
    }


}
