package com.ChatApplication.Config;

import com.ChatApplication.Security.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.nio.file.AccessDeniedException;
import java.util.Map;
@Component
@RequiredArgsConstructor
public class WebSocketAuthHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if(request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpServletRequest httpRequest = servletRequest.getServletRequest();

            try {
                String jwt = null;
                if (httpRequest.getCookies() != null) {
                    for (Cookie cookie : httpRequest.getCookies()) {
                        if ("token".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().trim().isEmpty()) {
                            jwt = cookie.getValue();
                            break;
                        }
                    }
                }
                if (jwt != null){
                    String username = jwtService.extractUsername(jwt);
                    if(username != null){
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        if (jwtService.isTokenValid(jwt, userDetails)){
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                            attributes.put("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                            attributes.put("USER_PRINCIPAL", auth);
                            attributes.put("USERNAME", username);
                            attributes.put("TOKEN", jwt);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            return true;
                        }else{
                            throw new AccessDeniedException("Invalid token");
                        }
                    }else{
                        throw new AccessDeniedException("Unauthorized WebSocket connection");
                    }
                }
            }catch (ExpiredJwtException e){
                throw new AccessDeniedException("Token expired");
            }catch (Exception e) {

                throw new AccessDeniedException("Authentication failed");
            }
        }

        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            System.out.println("Error during handshake");
        } else {
            System.out.println("HandShake completed successfully");
        }
    }
}
