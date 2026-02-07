package com.ChatApplication.Security;

import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@Component
public class JwtAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    private final CustomUserDetailService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserService userService;
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        final UserDetails userDetails = userDetailsService.loadUserByUsername(authentication.getName());

        String token = jwtService.generateToken(userDetails);

        Cookie cookie = new Cookie("token",token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(24*60*60);// 1 days

        response.addCookie(cookie);
        response.setStatus(HttpStatus.OK.value());
        response.setContentType("application/json");

        System.out.println("UserDetails: "+userDetails.toString());
        User user = this.userRepository.findByPhoneNumber(userDetails.getUsername())
                .orElseThrow(()-> new ResourceNotFoundException("username not found."));
        userService.updateUserStatus(user.getUserId(), UserStatus.ONLINE);
        Map<String,Object> res = new HashMap<>(1);
        res.put("username",userDetails.getUsername());
        res.put("userId",user.getUserId());
        res.put("message","Login Successful");

        request.setAttribute("AUTH_RESPONSE_DATA",res);
    }
}
