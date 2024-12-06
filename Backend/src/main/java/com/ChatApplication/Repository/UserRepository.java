package com.ChatApplication.Repository;

import com.ChatApplication.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public interface UserRepository extends MongoRepository<User,String> {
     Boolean existsByEmail(String email);
     Boolean existsByUserName(String username);
     Boolean existsByPhoneNumber(String phoneNumber);
}
