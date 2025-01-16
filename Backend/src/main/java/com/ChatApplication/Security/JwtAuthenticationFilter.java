package com.ChatApplication.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final HandlerExceptionResolver handlerExceptionResolver;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader =  request.getHeader("Authorization");
        if(authHeader ==  null || !authHeader.contains("Bearer ")){
            filterChain.doFilter(request,response);
            return;
        }
        try{
            final String jwt = authHeader.substring(7);
            String userName = jwtService.extractUsername(jwt);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if(userName != null && authentication == null){
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userName);
                if (jwtService.isTokenValid(jwt,userDetails)){
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    // add additional information about the authentication request
                    // It includes information like : session Id , Ip address and others
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
            filterChain.doFilter(request,response);
        }catch(Exception e){
            handlerExceptionResolver.resolveException(request,response,null,e);
        }
        
    }
}
// Example of what I might see in the Authentication object
//{
//principal: {
//username: "john@example.com",
//enabled: true,
//accountNonExpired: true
//        },
//authorities: ["ROLE_USER", "ROLE_ADMIN"],
//authenticated: true,
//details: {
//remoteAddress: "192.168.1.1",
//sessionId: "ABC123"
//        }
//        }

// Example user details
//UserDetails userDetails = {
//        username: "john@example.com",
//password: "<encoded_password>",
//authorities: ["ROLE_USER", "ROLE_ADMIN"],
//enabled: true
//        }
//
//// Created authentication token
//AuthenticationToken authToken = {
//        principal: userDetails,
//credentials: null,
//authorities: ["ROLE_USER", "ROLE_ADMIN"],
//details: {
//remoteAddress: "192.168.1.1",
//sessionId: "ABC123"
//        },
//authenticated: true
//        }
