package com.ChatApplication.Config;

import com.ChatApplication.Security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;


    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor stompHeaderAccessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (stompHeaderAccessor == null || stompHeaderAccessor.getCommand() == null) {
            return message; // Ignore messages without valid headers
        }

        logger.debug("Processing WebSocket message: {}", stompHeaderAccessor.getCommand());

        if (StompCommand.CONNECT.equals(stompHeaderAccessor.getCommand())) {
            String authHeader = stompHeaderAccessor.getFirstNativeHeader("Authorization" );
            String userId = stompHeaderAccessor.getFirstNativeHeader("userId");
            if (authHeader == null || !authHeader.startsWith("Bearer " )) {
                logger.warn("Missing or invalid Authorization header in WebSocket request" );
                throw new AccessDeniedException("Unauthorized WebSocket connection" );
            }

            try {
                String token = authHeader.substring(7);
                String username = jwtService.extractUsername(token);

                if (username != null) {
                    logger.debug("Extracted username from token: {}", username);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (jwtService.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );


                        Map<String,Object> sessionAttributes = stompHeaderAccessor.getSessionAttributes();
                        if(sessionAttributes == null){
                            stompHeaderAccessor.setSessionAttributes(new HashMap<>());
                        }

                        if(userId != null){
                            sessionAttributes.put("userId",userId);
                        }else{
                            System.out.println("Not found userId");
                        }
                        stompHeaderAccessor.setUser(auth); // Attach authentication to the WebSocket session
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        logger.info("WebSocket authentication successful for user: {}", username);
                    } else {
                        logger.warn("Invalid JWT token for user: {}", username);
                        throw new AccessDeniedException("Invalid token" );
                    }
                } else {
                    logger.warn("Failed to extract username from JWT token" );
                    throw new AccessDeniedException("Unauthorized WebSocket connection" );
                }
            } catch (Exception e) {
                logger.error("Error during WebSocket authentication", e);
                throw new AccessDeniedException("WebSocket authentication failed" );
            }
        }

        return message;
    }

}
