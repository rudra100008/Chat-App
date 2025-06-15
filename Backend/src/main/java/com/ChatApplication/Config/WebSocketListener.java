package com.ChatApplication.Config;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketListener {
    private final UserService userService;
    private final AuthUtils authUtils;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String,String> sessionUserMap = new ConcurrentHashMap<>();
    private final Map<String,String> userSessionMap = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> userActivity = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebConnectionListener(SessionConnectedEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        try{
            User user = authUtils.getLoggedInUserFromWebSocket(headerAccessor);
            String userId = user.getUserId();

            sessionUserMap.put(sessionId,userId);
            userSessionMap.put(userId,sessionId);
            userActivity.put(userId,LocalDateTime.now());

            userService.updateLastSeen(userId);
            userService.updateUserStatus(userId,UserStatus.ONLINE);
            userService.broadCastUserStatus(userId,UserStatus.ONLINE,user.getUsername());
        }catch (Exception e){
            System.out.println("Unexcepted Error Occurred: "+e.getMessage());
        }

    }

    // Try this event instead - it fires after subscription
    @EventListener
    public void handleWebSubscribeListener(SessionSubscribeEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        try{
            User user = authUtils.getLoggedInUserFromWebSocket(headerAccessor);
            String userId = user.getUserId();
//            sessionUserMap.put(sessionId,userId);
//            userSessionMap.put(userId,sessionId);
            userActivity.put(userId,LocalDateTime.now());

//            userService.updateLastSeen(userId);
//            userService.updateUserStatus(userId,UserStatus.ONLINE);
        }catch (Exception e){
            System.out.println("Unexcepted Error Occurred: "+e.getMessage());
        }
    }

    @EventListener
    public void  handleWebDisconnectListener(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userId = sessionUserMap.remove(sessionId);
        if(userId != null){
            userSessionMap.remove(userId);
            userActivity.remove(userId);
            userService.updateUserStatus(userId,UserStatus.OFFLINE);
            userService.updateLastSeen(userId);
            User user = userService.fetchUserByUserId(userId);
            userService.broadCastUserStatus(userId,UserStatus.OFFLINE,user.getUsername());
        }
    }

    @Scheduled(fixedRate = 10000)
    public void updateActiveUser(){
        for(String userId:userSessionMap.keySet()){
            try{
                LocalDateTime lastActive = userActivity.get(userId);
                UserStatus status;
                if(lastActive != null && lastActive.isBefore(LocalDateTime.now().minusMinutes(10))){
                   status = UserStatus.OFFLINE;
                }else{
                   status = UserStatus.ONLINE;
                }
                userService.updateLastSeen(userId);
                User  user = userService.fetchUserByUserId(userId);
                userService.updateUserStatus(userId,status);
                userService.broadCastUserStatus(userId,status,user.getUsername());
            }catch (Exception e){
                System.out.println("Failed to update last Seen for user: "+userId+" error: "+e.getMessage());
            }
        }
    }


}