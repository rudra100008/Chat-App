package com.ChatApplication.Repository;

import com.ChatApplication.Entity.ChatName;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatNameRepository extends MongoRepository<ChatName,String> {
}
