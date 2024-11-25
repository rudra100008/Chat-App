package com.ChatApplication.Repository;

import com.ChatApplication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User,Integer> {
    public Boolean existsByEmail(String email);
    public Boolean existsByUserName(String username);
    public Boolean existsByPhoneNumber(String phoneNumber);
}
