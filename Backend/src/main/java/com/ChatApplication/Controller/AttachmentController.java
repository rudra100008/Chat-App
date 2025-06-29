package com.ChatApplication.Controller;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Attachment;
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
            @RequestParam("chatId")String chatId,
            @RequestParam("file")MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            HttpServletRequest request
    )
    {
        StompHeaderAccessor headerAccessor = createHeaderAccessorFromHttp(request);
        Attachment attachment = attachmentService.uploadAttachment(file);
        MessageDTO savedMessage = messageService.postMessage(
                senderId,
                chatId,
                content,
                attachment,
                headerAccessor
        );
        messagingTemplate.convertAndSend("/private/chat/"+savedMessage.getChatId(),savedMessage);
        return  ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(savedMessage);
    }

    @GetMapping(value = "/download/{attachmentId}")
    public ResponseEntity<?> downloadAttachment(
            @PathVariable("attachmentId")String attachmentId
    ){
        Resource resource = this.attachmentService.downloadAttachment(attachmentId);
        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header("Content-Disposition","attachment; fileName=\""+ resource.getFilename()+"\"")
                .body(resource);
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
