package com.ChatApplication.Config;

import com.ChatApplication.Security.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;


    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpServletRequest httpRequest = servletRequest.getServletRequest();

            try {
                String jwt = null;

                // 1. Try Authorization header
                String authHeader = httpRequest.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    jwt = authHeader.substring(7);
                    log.info("Token found in Authorization header");
                }

                // 2. Try query parameter (?token=xxx) — browser WebSocket uses this
                if (jwt == null) {
                    jwt = httpRequest.getParameter("token");
                    if (jwt != null && !jwt.trim().isEmpty()) {
                        log.info("Token found in query parameter");
                    }
                }

                // 3. Try cookie
                if (jwt == null && httpRequest.getCookies() != null) {
                    for (Cookie cookie : httpRequest.getCookies()) {
                        if ("token".equals(cookie.getName()) &&
                                cookie.getValue() != null &&
                                !cookie.getValue().trim().isEmpty()) {
                            jwt = cookie.getValue();
                            log.info("Token found in cookie");
                            break;
                        }
                    }
                }

                if (jwt == null || jwt.trim().isEmpty()) {
                    log.warn("No token found in WebSocket handshake request");
                    return false;
                }

                String username = jwtService.extractUsername(jwt);
                if (username == null) {
                    log.warn("Could not extract username from token");
                    return false;
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    attributes.put("USER_PRINCIPAL", auth);
                    attributes.put("USERNAME", username);
                    attributes.put("TOKEN", jwt);
                    log.info("WebSocket handshake authenticated for: {}", username);
                    return true;
                }

                log.warn("Token validation failed for user: {}", username);
                return false;

            } catch (ExpiredJwtException e) {
                log.warn("Expired token during WebSocket handshake");
                return false;
            } catch (Exception e) {
                log.error("Handshake error: {}", e.getMessage());
                return false;
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
