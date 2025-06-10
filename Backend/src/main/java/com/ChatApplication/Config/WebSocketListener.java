package com.ChatApplication.Config;

import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketListener {
    private final UserService userService;
    private final Map<String,String> sessionUserMap = new ConcurrentHashMap<>();
    private final Map<String,String> userSessionMap = new ConcurrentHashMap<>();

//    @EventListener
//    public void handleWebConnectionListener(SessionConnectedEvent event){
//        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
//        Map<String,Object> sessionAttributes = headerAccessor.getSessionAttributes();
//        String sessionId = headerAccessor.getSessionId();
//        if(sessionAttributes != null && sessionAttributes.containsKey("userId")){
//            String userId = (String) sessionAttributes.get("userId");
//            sessionUserMap.put(sessionId,userId);
//            userSessionMap.put(userId,sessionId);
//            System.out.println("UserId (Connected): " + userId);
//        } else {
//            System.out.println("SessionConnectedEvent: userId not found");
//        }
//    }

    // Try this event instead - it fires after subscription
    @EventListener
    public void handleWebSubscribeListener(SessionSubscribeEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String,Object> sessionAttributes = headerAccessor.getSessionAttributes();
        String sessionId = headerAccessor.getSessionId();
        if(sessionAttributes != null && sessionAttributes.containsKey("userId")){
            String userId = (String) sessionAttributes.get("userId");
            sessionUserMap.put(sessionId,userId);
            userSessionMap.put(userId,sessionId);

            userService.updateLastSeen(userId);
            userService.updateUserStatus(userId, UserStatus.ONLINE);
            System.out.println("UserId (Subscribe): " + userId);
        } else {
            System.out.println("SessionSubscribeEvent: userId not found");
        }
    }

    @EventListener
    public void  handleWebDisconnectListener(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        String userId = sessionUserMap.remove(sessionId);
        if(userId != null){
            userSessionMap.remove(userId);
            userService.updateUserStatus(userId,UserStatus.OFFLINE);
            userService.updateLastSeen(userId);

        }
    }

    @Scheduled(fixedRate = 20000)
    public void updateActiveUser(){
        for(String userId:userSessionMap.keySet()){
            try{
                userService.updateLastSeen(userId);
                userService.updateUserStatus(userId,UserStatus.ONLINE);
            }catch (Exception e){
                System.out.println("Failed to update last Seen for user: "+userId+" error: "+e.getMessage());
            }
        }
    }
}