package com.ChatApplication.Config;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
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
@Slf4j
public class WebSocketListener {
    private final UserService userService;
    private final AuthUtils authUtils;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String,String> sessionUserMap = new ConcurrentHashMap<>();
    private final Map<String,String> userSessionMap = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> userActivity = new ConcurrentHashMap<>();

    private static final long INACTIVITY_THRESHOLD_MINUTES = 5;
    private static final long HEARTBEAT_INTERVAL_MS = 10000;

    @EventListener
    public void handleWebConnectionListener(SessionConnectedEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        try{
            User user = authUtils.getLoggedInUserFromWebSocket(headerAccessor);
            if(user == null){
                log.warn("Failed to authenticate user for session: {}",sessionId);
            }

            String userId = user.getUserId();

            registerUserSession(sessionId,userId);

            setUserOnline(userId,user.getUsername());

        }catch (Exception e){
            log.error("Error handling connection for session {}: {}", sessionId, e.getMessage(), e);
        }

    }
//   * Handles subscription events to update user activity
//     * This fires when users subscribe to topics/queues
    @EventListener
    public void handleWebSubscribeListener(SessionSubscribeEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        try{
            User user = authUtils.getLoggedInUserFromWebSocket(headerAccessor);
            if (user == null) {
                return;
            }
            String userId = user.getUserId();
            String destination = headerAccessor.getDestination();


            updateUserActivity(userId);

            log.debug("User subscribed - userId: {}, destination :{}",userId,destination);

        }catch (Exception e){
            log.error("Error handling subscription for session {}: {}", sessionId, e.getMessage());
        }
    }

    @EventListener
    public void  handleWebDisconnectListener(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        try{
            String userId = sessionUserMap.remove(sessionId);
            if(userId != null){
                unregisterSession(userId);

                setUserOffline(userId);

                log.debug("User disconnected - userId: {},  sessionId: {}",userId,sessionId);
            }
        }catch(Exception e){
            log.error("Error handling disconnection for session {}: {}", sessionId, e.getMessage(), e);
        }
    }

    @Scheduled(fixedRate = HEARTBEAT_INTERVAL_MS)
    public void updateActiveUser(){
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime inactivityThreshold = now.minusMinutes(INACTIVITY_THRESHOLD_MINUTES);

        userSessionMap.keySet().forEach(userId->{
            try{
                LocalDateTime lastActive = userActivity.get(userId);
                if(lastActive == null){
                    log.warn("No activity record found for userI:{}",userId);
                    return;
                }
                UserStatus currentStatus = determineUserStatus(lastActive,inactivityThreshold);
                updateUserStatusAndBroadCast(userId,currentStatus);
            }catch (Exception e){
                log.error("Failed to update status for userId {}: {}", userId, e.getMessage());
            }
        });
        log.debug("Updated status for {} active users", userSessionMap.size());
    }


    // private helper method

    private void registerUserSession(String sessionId,String userId){
        sessionUserMap.put(sessionId,userId);
        userSessionMap.put(userId,sessionId);
        userActivity.put(userId,LocalDateTime.now());
    }

    private void unregisterSession(String userId){
        userSessionMap.remove(userId);
        userActivity.remove(userId);
    }

    public void updateUserActivity(String userId){
        if(userSessionMap.containsKey(userId)){
            userActivity.put(userId,LocalDateTime.now());
        }
    }

    private void setUserOnline(String userId,String username){
        userService.updateUserStatus(userId,UserStatus.ONLINE);
        userService.updateLastSeen(userId);
        userService.broadCastUserStatus(userId,UserStatus.ONLINE,username);
    }

    private void setUserOffline(String userId){
        User user = this.userService.fetchUserByUserId(userId);
        userService.updateLastSeen(user.getUserId());
        userService.updateUserStatus(user.getUserId(),UserStatus.OFFLINE);
        userService.broadCastUserStatus(user.getUserId(),UserStatus.OFFLINE,user.getUsername());
    }

    private UserStatus determineUserStatus(LocalDateTime lastActive,LocalDateTime threshold){
        return lastActive.isBefore(threshold) ? UserStatus.OFFLINE : UserStatus.ONLINE;
    }

    private void updateUserStatusAndBroadCast(String userId,UserStatus status){
        User user = userService.fetchUserByUserId(userId);
        userService.updateUserStatus(user.getUserId(),status);
        userService.updateLastSeen(user.getUserId());
        userService.broadCastUserStatus(user.getUserId(),status,user.getUsername());
    }

    public int getActiveUserCount(){
        return userSessionMap.size();
    }

    public boolean isUserConnected(String userId){
        return userSessionMap.containsKey(userId);
    }

    public LocalDateTime getLastActivity(String userId){
        return userActivity.get(userId);
    }


}