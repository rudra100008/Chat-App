package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message,String> {
    List<Message> findBySenderOrderByTimestampAsc(User sender);
    List<Message> findByChatOrderByTimestampAsc(Chat chat);
    void deleteByChat(Chat chat);
}
