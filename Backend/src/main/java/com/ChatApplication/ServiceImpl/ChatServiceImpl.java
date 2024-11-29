package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.Service.ChatService;

import java.util.List;

public class ChatServiceImpl implements ChatService {
    @Override
    public List<ChatDTO> fetchUserChats(int userId) {
        return List.of();
    }

    @Override
    public ChatDTO createChat(List<Integer> participantsId) {
        return null;
    }

    @Override
    public ChatDTO addParticipants(int chatId, int userId) {
        return null;
    }

    @Override
    public List<ChatDTO> fetchAllParticipants(int chatId) {
        return List.of();
    }

    @Override
    public boolean isUserInChat(int chatId, int userId) {
        return false;
    }
}
