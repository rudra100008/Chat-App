package com.ChatApplication.Repository;

import com.ChatApplication.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User,String> {
     Boolean existsByEmail(String email);
     Boolean existsByUsername(String username);
     Boolean existsByPhoneNumber(String phoneNumber);
     Optional<User> findByEmail(String email);
     Optional<User> findByUsername(String username);
     Optional<User> findByPhoneNumber(String phoneNumber);
     List<User> findByUsernameContainingIgnoreCase(String username);
}
