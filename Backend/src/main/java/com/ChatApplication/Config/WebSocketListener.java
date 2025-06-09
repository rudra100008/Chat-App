package com.ChatApplication.Config;

import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketListener {
    private final UserService userService;

    @EventListener
    public void handleWebConnectionListener(SessionConnectedEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String,Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if(sessionAttributes != null && sessionAttributes.containsKey("userId")){
            String userId = (String) sessionAttributes.get("userId");
            System.out.println("UserId (Connected): " + userId);
        } else {
            System.out.println("SessionConnectedEvent: userId not found");
        }
    }

    // Try this event instead - it fires after subscription
    @EventListener
    public void handleWebSubscribeListener(SessionSubscribeEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String,Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if(sessionAttributes != null && sessionAttributes.containsKey("userId")){
            String userId = (String) sessionAttributes.get("userId");
            userService.updateLastSeen(userId);
            System.out.println("UserId (Subscribe): " + userId);
        } else {
            System.out.println("SessionSubscribeEvent: userId not found");
        }
    }
}