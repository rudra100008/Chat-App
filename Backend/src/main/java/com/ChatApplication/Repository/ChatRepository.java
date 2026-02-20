package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Chat,String> {
    List<Chat> findByParticipantIds(String userId);
    boolean existsByChatIdAndParticipantIds(String chatId,String userId);
    boolean existsByParticipantIdsAndChatType(List<String> participantIds, ChatType chatType);

    @Query("{ '_id': ?0, 'participantIds': ?1 }")
    Optional<Chat> findChatByChatIdAndUserId(String chatId, String userId);


}
