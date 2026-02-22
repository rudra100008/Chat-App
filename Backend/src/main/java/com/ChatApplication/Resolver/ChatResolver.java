package com.ChatApplication.Resolver;

import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatResolver {
    private final ChatRepository chatRepository;

    public Chat resolve(String chatId){
        return this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException("Chat not found"));
    }

//    public List<Chat> resolves(String userId){
//        return  this.chatRepository.find
//    }
}
