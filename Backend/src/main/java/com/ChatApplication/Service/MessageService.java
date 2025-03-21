package com.ChatApplication.Service;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.PageInfo;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;

@Service
public interface MessageService {
    PageInfo<MessageDTO> fetchMessagesBySenderId(String senderId, Integer pageNumber, Integer pageSize);
    PageInfo<MessageDTO> fetchMessagesByChatId(String chatId,Integer pageNumber,Integer pageSize);
    MessageDTO postMessage(String senderId, String chatId, String content, StompHeaderAccessor headerAccessor);
    MessageDTO updateMessage(String messageId,String newContent);
    void deleteMessage(String messageId);
    int countMessageByChatId(String chatId);
}
