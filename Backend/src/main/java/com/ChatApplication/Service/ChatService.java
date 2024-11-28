package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ChatService {
    List<ChatDTO> fetchUserChats(int userId);
    ChatDTO createChat(List<Integer> participantsId);
    ChatDTO addParticipants(int chatId,int userId);
    List<ChatDTO> fetchAllParticipants(int chatId);
    boolean isUserInChat(int chatId,int userId);

}
