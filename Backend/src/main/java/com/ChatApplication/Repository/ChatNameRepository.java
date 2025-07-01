package com.ChatApplication.Repository;

import com.ChatApplication.Entity.ChatDisplayName;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatNameRepository extends MongoRepository<ChatDisplayName,String> {
    Optional<ChatDisplayName> findByChatIdAndUserId(String chatId, String userId);
}
