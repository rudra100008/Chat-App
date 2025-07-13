package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Friend;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FriendRepository extends MongoRepository<Friend,String> {
    Optional<Friend> findByUserId(String userId);
}
