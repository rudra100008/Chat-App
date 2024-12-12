package com.ChatApplication.Service;

import com.ChatApplication.DTO.MessageDTO;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public interface MessageService {
    List<MessageDTO> fetchMessagesBySenderId(String senderId);
    List<MessageDTO> fetchMessagesByChatId(String chatId);
    MessageDTO postMessage(String senderId,String chatId,String content);
    MessageDTO updateMessage(String messageId,String newContent);
    void deleteMessage(String messageId);
}
