package com.ChatApplication.ServiceImpl;


import com.ChatApplication.Entity.Friend;
import com.ChatApplication.Repository.FriendRepository;
import com.ChatApplication.Service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {
    private final FriendRepository friendRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public void addFriend(String userId, String friendId) {
        if (userId.equals(friendId)) {
            throw new IllegalArgumentException("Cannot add yourself as friend");
        }
        Query query = new Query(Criteria.where("userId").is(userId));
        Update update = new Update().addToSet("friendIds",friendId)
                .set("updatedAt", LocalDateTime.now());
        mongoTemplate.upsert(query,update, Friend.class);

        Query query1 = new Query(Criteria.where("userId").is(friendId));
        Update update1 = new Update().addToSet("friendIds",userId)
                .set("updatedAt",LocalDateTime.now());
        mongoTemplate.upsert(query1,update1,Friend.class);
    }

    @Override
    public List<String> getFriends(String userId) {
       return friendRepository.findByUserId(userId)
               .map(Friend::getFriendIds)
               .orElse(List.of());
    }
}
