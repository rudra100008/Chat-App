package com.ChatApplication.Config;

import com.ChatApplication.Security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // This method checks every message before it's sent through the WebSocket.
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // Step 1: Get the message header
        StompHeaderAccessor stompHeaderAccessor = MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);
        // Step 2: Check if this is new connection attempt
        assert stompHeaderAccessor != null;
        if (StompCommand.CONNECT.equals(stompHeaderAccessor.getCommand()) ||
                StompCommand.SEND.equals(stompHeaderAccessor.getCommand()) ||
                StompCommand.SUBSCRIBE.equals(stompHeaderAccessor.getCommand())) {
            if (stompHeaderAccessor.getUser() == null){
            // Step 3: Get the JWT token from the headers
            String authHeader = stompHeaderAccessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                // Step 4: Get the username from the token
                String username = jwtService.extractUsername(token);
                if (username != null) {
                    // Step 5: Load the user's details
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // Step 6: Verify the token is valid
                    if (jwtService.isTokenValid(token, userDetails)) {
                        // Step 7: Create authentication token
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails,      // Principal (the user)
                                null,            // Credentials (password, set to null for security)
                                userDetails.getAuthorities()  // Authorities/Roles
                        );
                        // Step 8: Store the authentication
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        stompHeaderAccessor.setUser(auth);
                    }
                }
            }
        }else{
                SecurityContextHolder.getContext().setAuthentication((Authentication) stompHeaderAccessor.getUser() );
            }
        }
        return message;
    }
}
