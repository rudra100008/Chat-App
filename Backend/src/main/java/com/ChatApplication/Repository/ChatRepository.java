package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<Chat,String> {
    List<Chat> findByParticipants(User user);
    boolean existsByChatIdAndParticipantsContaining(String chatId,User user);
    boolean existsByParticipantsAndChatType(List<User> participants, ChatType chatType);

}
