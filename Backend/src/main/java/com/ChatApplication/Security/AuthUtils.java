package com.ChatApplication.Security;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {
    private final UserRepository userRepository;

    // Retrieves the logged-in user's details from SecurityContextHolder
    public User getLoggedInUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(!authentication.isAuthenticated()){
            throw new IllegalArgumentException("No authenticated user found");
        }

        return userRepository.findByPhoneNumber(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        authentication.getName() + " not found in the server."));
    }

    // Retrieves the logged-in user's details from WebSocket session
    public User getLoggedInUserFromWebSocket(StompHeaderAccessor stompHeaderAccessor) {
        Authentication authentication = (Authentication) stompHeaderAccessor.getUser();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("No authenticated user found.");
        }
//        System.out.println("User: " + authentication.getName());
//        System.out.println("Authentication: " + authentication);
//        System.out.println("Header: " + stompHeaderAccessor.toNativeHeaderMap() );
        return userRepository.findByPhoneNumber(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        authentication.getName() + " not found in the server."));
    }
}
