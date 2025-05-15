package com.ChatApplication.Repository;

import com.ChatApplication.entity.ChatDisplayName;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatNameRepository extends MongoRepository<ChatDisplayName,String> {
    ChatDisplayName findByChatIdAndUserId(String chatId,String userId);
}
