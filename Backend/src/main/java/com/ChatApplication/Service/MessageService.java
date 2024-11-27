package com.ChatApplication.Service;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public interface MessageService {
    List<MessageDTO> fetchMessagesBySenderId(int  senderId);
    List<MessageDTO> fetchMessagesByChatId(int chatId);
    MessageDTO postMessage(int senderId,int chatId,String content);
    MessageDTO updateMessage(int messageId,String newContent);
    void deleteMessage(int messageId);
}
