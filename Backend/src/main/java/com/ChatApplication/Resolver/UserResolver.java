package com.ChatApplication.Resolver;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserResolver {
    private final UserRepository userRepository;


    public User resolve(String userId){
        return this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException("User not found."));
    }
}
