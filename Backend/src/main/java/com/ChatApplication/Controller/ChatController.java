package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@SuppressWarnings("unused")
public class ChatController {

    private static final String ERROR_KEY = "Error";
    private final ChatService chatService;
    private final ChatDisplayNameService chatDisplayNameService;
    private final UserService userService;
    private final AuthUtils authUtils;
    private final ImageService imageService;
    private final CloudFileService cloudFileService;
    @Value("${image.upload.dir}")
    private  String baseUploadDir;


    @PostMapping
    public ResponseEntity<?> createChat(
            @Valid @RequestBody CreateChatDTO createChatDTO,
            BindingResult result
            ){
        if(result.hasErrors()){
            Map<String,Object> errResponse = new HashMap<>();
            result.getFieldErrors()
                    .forEach(f -> errResponse.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errResponse);
        }
        ChatDTO savedChat = this.chatService.createChat(createChatDTO);
        return new ResponseEntity<>(savedChat, HttpStatus.OK);
    }

    @PostMapping("/groupChat/{chatName}")
    public ResponseEntity<ChatDTO> createGroupChat(
            @PathVariable("chatName") String chatName,
            @RequestBody List<String> participantIds){
        User loggedInUser = authUtils.getLoggedInUsername();
        participantIds.add(loggedInUser.getUserId());
        ChatDTO chatDTO = ChatDTO.builder()
                .chatName(chatName)
                .participantIds(participantIds)
                .chatType(ChatType.GROUP)
                .createdAt(LocalDateTime.now())
                .build();
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
    public ResponseEntity<Map<?,?>> removeChat(
            @PathVariable("chatId")String chatId
    ){
        this.chatService.deleteChat(chatId);
        return  ResponseEntity.status(HttpStatus.OK).body(Map.of("message","Chat deleted successfully."));
    }

    @GetMapping("/chatDetails/{chatId}")
    public ResponseEntity<ChatDTO> getUserChat(
            @PathVariable("chatId")String chatId
    )
    {
        ChatDTO chatDTO = this.chatService.fetchChatById(chatId);
        return ResponseEntity.ok(chatDTO);
    }

    @GetMapping(value = "/groupImage",produces = {MediaType.IMAGE_JPEG_VALUE,MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Object> getGroupImage(
            @RequestParam("chatId")String chatId
            ){
        String uploadDir = baseUploadDir + File.separator + "groupChat";
        ChatDTO chatFetched = chatService.fetchChatById(chatId);
        String imageName = chatFetched.getChatImageUrl();

        if(imageName == null || imageName.trim().isEmpty()){
           imageName = "defaultGroupChat.jpg";
        }
        File directory  = new File(uploadDir);
        if(!directory.exists()){
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("Error:","Image directory not found"));
        }
        try{
             byte[] b = imageService.getImage(uploadDir,imageName);
             return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.IMAGE_JPEG).body(b);
        }catch(IOException e){
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,e.getMessage()));
        }catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"Unexcepted error occurred: "+e.getMessage()));
        }
    }

    @PostMapping(value = "/uploadChatImage/{chatId}",consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Object> uploadGroupImage(
            @PathVariable("chatId") String chatId,
            @RequestParam(value = "image",required = false)MultipartFile imageFile){
        User currentUser = authUtils.getLoggedInUsername();
        String uploadDir = baseUploadDir + File.separator + "groupChat";
        String imageName;
        ChatDTO  chatDTO = chatService.fetchChatById(chatId);
        if(!chatDTO.getAdminIds().contains(currentUser.getUserId())){
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"Only group admin can remove group Image."));
        }
        if(chatDTO.getChatType() != ChatType.GROUP){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY, "Image upload is allowed for only Group Chat"));
        }
        if(imageFile == null || imageFile.isEmpty()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"Image file is required"));
        }

            try{
                String currentChatImageUrl = chatDTO.getChatImageUrl();
                if(chatDTO.getChatImageUrl() != null && !currentChatImageUrl.trim().isEmpty()){
                    imageService.deleteImage(uploadDir,currentChatImageUrl);
                }
                imageName = imageService.uploadImage(uploadDir,imageFile);
            }catch (IOException e){
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(ERROR_KEY, e.getMessage()));
            }catch (Exception e){
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(ERROR_KEY,"Unexcepted error occurred: "+e.getMessage()));
            }

        chatDTO.setChatImageUrl(imageName);
        ChatDTO  updatedChat = chatService.updateGroupChat(chatDTO);
        return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_JSON).body(updatedChat);
    }

    @DeleteMapping(value = "/removeChatImage/{chatId}")
    public ResponseEntity<Object> removeChatImage(@PathVariable("chatId")String chatId){
        try {
            User currentUser = authUtils.getLoggedInUsername();
            String uploadDir = baseUploadDir + File.separator + "groupChat";
            ChatDTO chatDTO = chatService.fetchChatById(chatId);
            if(!chatDTO.getAdminIds().contains(currentUser.getUserId())){
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(ERROR_KEY,"Only group admin can remove group Image."));
            }
            if(chatDTO.getChatType() != ChatType.GROUP){
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(ERROR_KEY, "Image removal is allowed for only Group Chat"));
            }
            if(chatDTO.getChatImageUrl() == null || chatDTO.getChatImageUrl().isEmpty()){
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(ERROR_KEY,"Image file is null"));
            }
            this.imageService.deleteImage(uploadDir,chatDTO.getChatImageUrl());
            chatDTO.setChatImageUrl(null);
            ChatDTO updatedChat = chatService.updateGroupChat(chatDTO);
            return  ResponseEntity.status(HttpStatus.OK)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(updatedChat);

        }catch (Exception e){
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"Unexcepted error occurred: "+e.getMessage()));
        }
    }

    @PutMapping(value = "/updateGroupChat/{chatId}")
    public ResponseEntity<Object> updateGroupChat(
            @PathVariable("chatId")String chatId,
            @RequestParam("chatName")String chatName
    ){
        ChatDTO databaseChat = chatService.fetchChatById(chatId);
        User currentUser = authUtils.getLoggedInUsername();
        if(databaseChat.getChatType() != ChatType.GROUP){
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"This is allowed for only Group Chat."));
        }
        if (chatName == null || chatName.trim().isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY, "Chat name cannot be empty"));
        }
        if(!databaseChat.getAdminIds().contains(currentUser.getUserId())){
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(ERROR_KEY,"Only group Admin can update the chat"));
        }
        databaseChat.setChatName(chatName);
        ChatDTO updatedChat = chatService.updateGroupChat(databaseChat);
        return ResponseEntity
                .status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(updatedChat);
    }

    @PutMapping("/promoteUserToAdmin")
    public ResponseEntity<ChatDTO> promoteUserToAdmin(
            @RequestParam("chatId")String chatId,
            @RequestParam("userId") String userId
    ){
        ChatDTO chat = this.chatService.addAdminToChat(chatId,userId);
        return ResponseEntity.ok(chat);
    }

    @PutMapping("/removeUser")
    public ResponseEntity<ChatDTO> removeUser(
            @RequestParam("chatId") String chatId,
            @RequestParam("userId")String userId
    ){
        ChatDTO chat= this.chatService.removeUser(chatId,userId);
        return ResponseEntity.ok(chat);
    }
}
