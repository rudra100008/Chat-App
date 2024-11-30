package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat,Integer> {
    List<Chat> findByParticipants(User user);
}
