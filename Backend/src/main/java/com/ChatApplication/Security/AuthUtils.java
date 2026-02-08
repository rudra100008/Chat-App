package com.ChatApplication.Security;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthUtils {
    private final UserRepository userRepository;

    // Retrieves the logged-in user's details from SecurityContextHolder
    public User getLoggedInUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if( authentication == null || !authentication.isAuthenticated()){
            throw new IllegalArgumentException("User is not authenticated.");
        }
        User user = (User) authentication.getPrincipal();

        log.debug("User: {}",user.toString());
        return user;
    }

    // Retrieves the logged-in user's details from WebSocket session
    public User getLoggedInUserFromWebSocket(StompHeaderAccessor stompHeaderAccessor) {
        Authentication authentication = (Authentication) stompHeaderAccessor.getUser();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated.");
        }
        User user = (User) authentication.getPrincipal();

        log.debug("User: {}",user.toString());
        return user;
    }
}
