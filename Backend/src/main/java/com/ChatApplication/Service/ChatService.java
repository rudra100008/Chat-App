package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ChatService {
    // get all the chats of a user
    List<ChatDTO> fetchUserChats(String userId);
    //create a chat with two users
    ChatDTO createChat(ChatDTO chatDTO);
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
    ChatDTO fetchUserChat(String chatId, StompHeaderAccessor headerAccessor);
    //update the group chat
    ChatDTO updateGroupChat(ChatDTO chatDTO);

}
