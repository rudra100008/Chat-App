package com.ChatApplication.Service;

import com.ChatApplication.DTO.ChatDisplayNameDTO;
import org.springframework.stereotype.Service;

@Service
public interface ChatDisplayNameService {
    ChatDisplayNameDTO fetchChatName(String chatId,String userId);
    ChatDisplayNameDTO saveChatName(String chatId,String chatName,String userId);
}
