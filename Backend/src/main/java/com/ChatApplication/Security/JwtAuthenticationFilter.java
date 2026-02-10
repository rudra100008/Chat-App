package com.ChatApplication.Security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final CustomUserDetailService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException
    {
        try{
            List<String> allowedPaths = List.of("/auth/signup", "/auth/login");
            String path = request.getServletPath();

            for(String allowedPath : allowedPaths) {
                if (path.equals(allowedPath) || path.startsWith("/server/")) {

                    filterChain.doFilter(request, response);
                    return;
                }
            }
           String jwt = null;
           if (request.getCookies() != null){
               for (Cookie cookie : request.getCookies()){
                   if ("token".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().trim().isEmpty()){
                       jwt = cookie.getValue();
                       break;
                   }
               }
           }
           if (jwt != null){
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
                       // It includes information like : sessionId , Ip address and others
                       auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                       SecurityContextHolder.getContext().setAuthentication(auth);
                   }
               }
           }
            filterChain.doFilter(request,response);
        }catch (ExpiredJwtException e){
            sendErrorResponse(response,"token_expired","Token has expired. Please login again",HttpServletResponse.SC_UNAUTHORIZED);
        }catch(MalformedJwtException e) {
            sendErrorResponse(response, "invalid_token", "Invalid token format", HttpServletResponse.SC_UNAUTHORIZED);
        }catch (Exception e) {
            sendErrorResponse(response,"authentication_error","Authentication failed",HttpServletResponse.SC_UNAUTHORIZED);
        }

    }
    private void sendErrorResponse(HttpServletResponse response,String error ,String message,int status)
            throws IOException{
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(
                String.format("{\"error\":  \"%s\", \"message\" : \"%s\"}",error,message)
        );
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
