package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<Chat,String> {
    List<Chat> findByParticipants(User user);
    boolean existsByChatIdAndParticipants(String chatId,User user);
    void deleteByMessages(Message message);
}
