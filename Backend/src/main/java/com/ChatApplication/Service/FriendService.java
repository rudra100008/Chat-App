package com.ChatApplication.Service;

import com.ChatApplication.DTO.FriendDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface FriendService {
    void addFriend(String userId, String friendId);
    List<String> getFriends(String userId);
}
