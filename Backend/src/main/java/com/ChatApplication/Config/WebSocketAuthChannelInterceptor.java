package com.ChatApplication.Config;

import com.ChatApplication.Security.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;


    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor stompHeaderAccessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (stompHeaderAccessor == null || stompHeaderAccessor.getCommand() == null) {
            return message; // Ignore messages without valid headers
        }

        log.debug("Processing WebSocket message: {}", stompHeaderAccessor.getCommand());
        if (StompCommand.CONNECT.equals(stompHeaderAccessor.getCommand())) {
            try {
                String token = null;

                String authHeader = stompHeaderAccessor.getFirstNativeHeader("Authorization");

                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    log.warn("No Authorization header in STOMP CONNECT");
                    throw new MessagingException("Unauthorized");
                }

                token = authHeader.substring(7);

                log.info("Token received");
                String username = jwtService.extractUsername(token);
                if(username == null){
                    log.info("username is null when extracting from token");
                    throw new MessagingException("Invalid token.");


                }


                    log.debug("Extracted username from token: {}", username);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (jwtService.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );

                        stompHeaderAccessor.setUser(auth); // Attach authentication to the WebSocket session
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.info("WebSocket authentication successful for user: {}", username);
                    } else {
                        log.warn("Invalid JWT token for user: {}", username);
                        throw new AccessDeniedException("Invalid token" );
                    }

            }catch (ExpiredJwtException e){
                throw new MessagingException("Token expired: "+e.getMessage());
            }
            catch (Exception e) {
                log.error("Error during WebSocket authentication", e);
                throw new AccessDeniedException("WebSocket authentication failed" );
            }
        }

        return message;
    }

}
