package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public interface ChatService {
    // get all the chats of a user
    List<ChatDTO> fetchUserChats(String userId);
    //create a chat with two users
    ChatDTO createChat(CreateChatDTO createChatDTO);
    ChatDTO createGroupChat(ChatDTO chatDTO);
    // add participants in the chat
    ChatDTO addParticipants(String chatId,String userId);
    // get all the participants in the chat
    List<UserDTO> fetchChatParticipants(String chatId);
    //check if the user is in chat or not
    boolean isUserInChat(String chatId,String userId);
    //removes the participants from the chat
    ChatDTO deleteParticipants(String chatId,String userId);
    void deleteChat(String chatId);
    //get single chat of the user
    ChatDTO fetchChatById(String chatId);
    //update the group chat
    ChatDTO updateGroupChat(ChatDTO chatDTO);
    // update group chat image
    ChatDTO updateGroupChatImageInCloud(String chatId,String userId, MultipartFile imageFile);

    String fetchGroupImageSecureUrl(String chatId, String userId, MultipartFile imageFile);

    ChatDTO addAdminToChat(String chatId,String userId);

    ChatDTO removeUser(String chatId, String userId);

}
