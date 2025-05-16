package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message,String> {
    Page<Message> findBySenderOrderByTimestampAsc(User sender, Pageable pageable);
    Page<Message> findByChatOrderByTimestampAsc(Chat chat,Pageable pageable);
    void deleteByChat(Chat chat);
    int countByChat(Chat chat);
}
