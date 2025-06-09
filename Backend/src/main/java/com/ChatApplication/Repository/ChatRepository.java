package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<Chat,String> {
    List<Chat> findByParticipants_UserIdIn(String userId);
    boolean existsByChatIdAndParticipants_UserIdIn(String chatId,String userId);
    boolean existsByParticipantsAndChatType(List<User> participants, ChatType chatType);

}
