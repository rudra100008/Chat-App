package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatResponse;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public interface ChatService {
    // get all the chats of a user
    List<ChatResponse> fetchUserChats(String userId);
    //create a chat with two users
    ChatResponse createChat(CreateChatDTO createChatDTO);
    ChatResponse createGroupChat(ChatResponse chatResponse);
    // add participants in the chat
    ChatResponse addParticipants(String chatId, String userId);
    // get all the participants in the chat
    List<UserDTO> fetchChatParticipants(String chatId);
    //check if the user is in chat or not
    boolean isUserInChat(String chatId,String userId);
    //removes the participants from the chat
    ChatResponse deleteParticipants(String chatId, String userId);
    void deleteGroupChat(String chatId);
    //get single chat of the user
    ChatResponse fetchChatById(String chatId);
    //update the group chat
    ChatResponse updateGroupChat(ChatResponse chatResponse);

    // update group chat image
    ChatResponse updateGroupChatImageInCloud(String chatId, String userId, MultipartFile imageFile)throws IOException;
    // fetch group chat image
    String fetchGroupImageSecureUrl(String chatId)throws IOException;

    ChatResponse addAdminToChat(String chatId, String userId);

//    ChatResponse removeUser(String chatId, String userId);

}
