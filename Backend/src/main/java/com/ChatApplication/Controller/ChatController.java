package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.ChatDisplayNameService;
import com.ChatApplication.Service.ChatService;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final ChatDisplayNameService chatDisplayNameService;
    private final UserService userService;
    private final AuthUtils authUtils;
    private final ImageService imageService;
    @Value("${file.upload.dir}")
    private String baseUploadDir;


    @PostMapping()
    public ResponseEntity<ChatDTO> createChat(
            @RequestParam String phoneNumber,
            @RequestParam String chatName){
        User loginUser = this.authUtils.getLoggedInUsername();
        User otherUser = this.userService.findByPhoneNumber(phoneNumber);
        ChatDTO chatDTO = new ChatDTO();
        List<String> participantsIds = new ArrayList<>();
        participantsIds.add(otherUser.getUserId());
        participantsIds.add(loginUser.getUserId());
        chatDTO.setParticipantIds(participantsIds);
        chatDTO.setChatType(ChatType.SINGLE);
        ChatDTO savedChat = this.chatService.createChat(chatDTO);

        String otherUserChatName =  loginUser.getPhoneNumber();
        this.chatDisplayNameService.saveChatName(savedChat.getChatId(), chatName, loginUser.getUserId());
        chatDisplayNameService.saveChatName(savedChat.getChatId(),otherUserChatName,otherUser.getUserId());
        return new ResponseEntity<>(savedChat, HttpStatus.OK);
    }
    @PostMapping("/groupChat/{chatName}")
    public ResponseEntity<ChatDTO> createGroupChat(
            @PathVariable("chatName") String chatName,
            @RequestBody List<String> participantIds){
        ChatDTO chatDTO = new ChatDTO();
        chatDTO.setChatName(chatName);
        chatDTO.setParticipantIds(participantIds);
        chatDTO.setChatType(ChatType.GROUP);
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
    public ResponseEntity<String> removeChat(
            @PathVariable("chatId")String chatId
    ){
        this.chatService.deleteChat(chatId);
        return  ResponseEntity.ok("Chat Deleted");
    }

    @GetMapping("/chatDetails/{chatId}")
    public ResponseEntity<?> getUserChat(
            @PathVariable("chatId")String chatId,
            StompHeaderAccessor headerAccessor
    )
    {
        ChatDTO chatDTO = this.chatService.fetchUserChat(chatId,headerAccessor);
        return ResponseEntity.ok(chatDTO);
    }

    @GetMapping(value = "/groupImage",produces = {MediaType.IMAGE_JPEG_VALUE,MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> getGroupImage(
            @RequestParam("chatId")String chatId,
            StompHeaderAccessor headerAccessor
            ){
        String uploadDir = baseUploadDir + File.separator + "groupChat";
        ChatDTO getUserChat = chatService.fetchUserChat(chatId,headerAccessor);
        String imageName = getUserChat.getChatImageUrl();
        System.out.println("Image name: "+uploadDir + File.separator + imageName);

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
                    .body("Error reading image:\n"+e.getMessage());
        }catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("Error","Unexcepted error occurred: "+e.getMessage()));
        }
    }

    @PostMapping(value = "/uploadGroupImage/{chatId}",consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> uploadGroupImage(
            @PathVariable("chatId") String chatId,
            StompHeaderAccessor headerAccessor,
            @RequestParam(value = "image",required = false)MultipartFile imageFile){
        String uploadDir = baseUploadDir + File.separator + "groupChat";
        String imageName = "";
        ChatDTO  chatDTO = chatService.fetchUserChat(chatId,headerAccessor);
        if(imageFile != null && !imageFile.isEmpty()){
            try{
                imageName = imageService.uploadImage(uploadDir,imageFile);
            }catch (IOException e){
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("Error: "+e.getMessage());
            }catch (Exception e){
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("Error","Unexcepted error occurred: "+e.getMessage()));
            }
        }
        chatDTO.setChatImageUrl(imageName);
        ChatDTO  updatedChat = chatService.updateGroupChat(chatDTO);
        return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_JSON).body(updatedChat);
    }
}
