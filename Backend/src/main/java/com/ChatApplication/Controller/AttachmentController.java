package com.ChatApplication.Controller;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Attachment;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.AttachmentRepository;
import com.ChatApplication.Service.AttachmentService;
import com.ChatApplication.Service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attachments")
public class AttachmentController {
    private final AttachmentRepository attachmentRepository;
    private final AttachmentService attachmentService;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping(value = "/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("senderId") String senderId,
            @RequestParam("chatId") String chatId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            HttpServletRequest request
    ) {
        try {
            StompHeaderAccessor headerAccessor = createHeaderAccessorFromHttp(request);
            Attachment attachment = attachmentService.uploadAttachmentToCloud(file);
            MessageDTO savedMessage = messageService.postMessage(
                    senderId,
                    chatId,
                    content,
                    attachment,
                    headerAccessor
            );
            messagingTemplate.convertAndSend("/private/chat/" + savedMessage.getChatId(), savedMessage);
            return ResponseEntity.status(HttpStatus.OK)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(savedMessage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error: " + e.getMessage());
        }
    }

    @GetMapping(value = "/download/{attachmentId}")
    public ResponseEntity<?> downloadAttachment(
            @PathVariable("attachmentId") String attachmentId
    ) {
        try {
            Resource resource = attachmentService.downloadAttachmentFromCloud(attachmentId);
            return ResponseEntity.status(HttpStatus.OK)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header("Content-Disposition", "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File download failed: " + e.getMessage());
        }
    }
    private StompHeaderAccessor createHeaderAccessorFromHttp(HttpServletRequest request){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.create(StompCommand.SEND);
        String authToken  = request.getHeader("Authorization");
        if(authToken != null){
            headerAccessor.addNativeHeader("Authorization",authToken);
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication != null  && authentication.isAuthenticated()){
            headerAccessor.setUser(authentication);
        }
        return headerAccessor;
    }
}
