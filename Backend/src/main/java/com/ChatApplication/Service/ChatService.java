package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ChatService {
    // get all the chats of a user
    List<ChatDTO> fetchUserChats(int userId);
    //create a chat
    ChatDTO createChat(List<Integer> participantsId);
    // add participants in the chat
    ChatDTO addParticipants(int chatId,int userId);
    // get all the participants in the chat
    List<UserDTO> fetchChatParticipants(int chatId);
    //check if the user is in chat or not
    boolean isUserInChat(int chatId,int userId);

}
