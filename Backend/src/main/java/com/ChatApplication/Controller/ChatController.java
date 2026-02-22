package com.ChatApplication.Controller;

import com.ChatApplication.DTO.ChatResponse;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
        ChatResponse savedChat = this.chatService.createChat(createChatDTO);
        return new ResponseEntity<>(savedChat, HttpStatus.OK);
    }

    @PostMapping("/groupChat/{chatName}")
    public ResponseEntity<ChatResponse> createGroupChat(
            @PathVariable("chatName") String chatName,
            @RequestBody List<String> participantIds){
        User loggedInUser = authUtils.getLoggedInUsername();
        participantIds.add(loggedInUser.getUserId());
        ChatResponse chatResponse = ChatResponse.builder()
                .chatName(chatName)
                .participantIds(participantIds)
                .chatType(ChatType.GROUP)
                .createdAt(LocalDateTime.now())
                .build();
        ChatResponse savedGroupChat = this.chatService.createGroupChat(chatResponse);
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
    public ResponseEntity<List<ChatResponse>> fetchUserChat(@PathVariable("userId") String userId){
        List<ChatResponse> fetchedChats = this.chatService.fetchUserChats(userId);
        return ResponseEntity.ok(fetchedChats);
    }

    //add Participants in the
    @PatchMapping("/{chatId}/user/{userId}")
    public ResponseEntity<ChatResponse> addParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId") String userId
    ){
        ChatResponse updatedChat = this.chatService.addParticipants(chatId,userId);
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
    public ResponseEntity<ChatResponse> removeParticipants(
            @PathVariable("chatId")String chatId,
            @PathVariable("userId")String userId
    ){
        ChatResponse chatResponse = this.chatService.deleteParticipants(chatId,userId);
        return ResponseEntity.ok(chatResponse);
    }

    @DeleteMapping("/groupChat/{chatId}")
    public ResponseEntity<Map<?,?>> deleteGroupChat(
            @PathVariable("chatId")String chatId
    ){
        this.chatService.deleteGroupChat(chatId);
        return  ResponseEntity.status(HttpStatus.OK).body(Map.of("message","Group chat deleted successfully."));
    }

    @GetMapping("/chatDetails/{chatId}")
    public ResponseEntity<ChatResponse> getUserChat(
            @PathVariable("chatId")String chatId
    )
    {
        ChatResponse chatResponse = this.chatService.fetchChatById(chatId);
        return ResponseEntity.ok(chatResponse);
    }

    @GetMapping(value = "/groupImage",produces = {MediaType.IMAGE_JPEG_VALUE,MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Object> getGroupImage(
            @RequestParam("chatId")String chatId
            ){
        String uploadDir = baseUploadDir + File.separator + "groupChat";
        ChatResponse chatFetched = chatService.fetchChatById(chatId);
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


    @PatchMapping("/{chatId}/uploadGroupImage/user/{userId}")
    public ResponseEntity<?> uploadGroupImageInCloud(
            @PathVariable("chatId") String chatId,
            @PathVariable("userId")String userId,
            @RequestParam("imageFile")MultipartFile imageFile
    ){
        try{
            ChatResponse chatResponse = this.chatService.updateGroupChatImageInCloud(chatId,userId,imageFile);
            return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_JSON).body(chatResponse);
        }catch (IOException e){
            throw new ImageInvalidException(String.format("Failed to update group image: %s",e.getMessage()));
        }
    }

    @GetMapping("/{chatId}/fetchGroupImage")
    public ResponseEntity<?> fetchGroupImage(
            @PathVariable("chatId")String chatId
    ){
        try{
            String secureUrl = this.chatService.fetchGroupImageSecureUrl(chatId);
            return ResponseEntity.status(HttpStatus.OK)
                    .body(Map.of(
                            "chatId",chatId,
                            "secureUrl",secureUrl
                    ));
        }catch (IOException e){
            throw new ImageInvalidException(String.format("Failed to fetch group image: %s",e.getMessage()));
        }
    }



    @PutMapping(value = "/updateGroupChat/{chatId}")
    public ResponseEntity<Object> updateGroupChat(
            @PathVariable("chatId")String chatId,
            @RequestBody ChatResponse chatResponse
    ){
        ChatResponse updatedChat = chatService.updateGroupChat(chatResponse);
        return ResponseEntity
                .status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_JSON)
                .body(updatedChat);
    }

    @PutMapping("/promoteUserToAdmin")
    public ResponseEntity<ChatResponse> promoteUserToAdmin(
            @RequestParam("chatId")String chatId,
            @RequestParam("userId") String userId
    ){
        ChatResponse chat = this.chatService.addAdminToChat(chatId,userId);
        return ResponseEntity.ok(chat);
    }

//    @PutMapping("/removeUser")
//    public ResponseEntity<ChatResponse> removeUser(
//            @RequestParam("chatId") String chatId,
//            @RequestParam("userId")String userId
//    ){
//        ChatResponse chat= this.chatService.removeUser(chatId,userId);
//        return ResponseEntity.ok(chat);
//    }
}
