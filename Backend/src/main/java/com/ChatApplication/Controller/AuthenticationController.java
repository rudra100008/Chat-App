
package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.CustomUserDetailService;
import com.ChatApplication.Security.JwtAuthenticationSuccessHandler;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.UserService;
import com.ChatApplication.TwoFactorAuth.TwoFactorAuthService;
import com.ChatApplication.TwoFactorAuth.TwoFactorRequest;
import com.ChatApplication.TwoFactorAuth.TwoFactorResponse;
import com.ChatApplication.TwoFactorAuth.TwoFactorVerification;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
@Slf4j
public class AuthenticationController {
    private final UserService userService;
    private final JwtService jwtService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final CustomUserDetailService userDetailsService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtAuthenticationSuccessHandler authenticationSuccessHandler;
    @Value("${image.upload.dir}")
    private String baseUploadDir;


    @PostMapping(path = "/signup",consumes = {MediaType.MULTIPART_FORM_DATA_VALUE,MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> signup(
            @Valid @RequestPart(value = "user") UserDTO userDTO,
            BindingResult result,
            @RequestPart(value = "image",required = false) MultipartFile imageFile
    )
    {
        if(result.hasErrors()){
            Map<String,Object> errors = new HashMap<>();
            result.getFieldErrors().forEach(f-> errors.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
        }
        try{
            userDTO = userService.signup(userDTO,imageFile);
        }catch (IOException e){
            throw new  ImageInvalidException("Failed to upload image ");
        }
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userDTO);
    }


//    @PostMapping("/login")
//    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
//            User authenticatedUser = userService.authenticate(request);
//            String jwtToken = jwtService.generateToken(authenticatedUser);
//            UserDetails userDetails = userDetailsService.loadUserByUsername(authenticatedUser.getUsername());
//            Boolean isTokenValid = jwtService.isTokenValid(jwtToken,userDetails);
//            AuthResponse response = new AuthResponse(authenticatedUser,jwtToken, isTokenValid);
//            userService.updateLastSeen(authenticatedUser.getUserId());
//            return ResponseEntity.ok(response);
//    }
@PostMapping("/login")
public ResponseEntity login(
        @RequestBody AuthRequest authRequest,
        HttpServletResponse servletResponse,
        HttpServletRequest servletRequest
) {
    try{
        log.debug("=== LOGIN ATTEMPT ===");
        log.debug("Identifier: {}", authRequest.getUserName());  // ✅ Changed
        log.debug("Password provided: {} " , (authRequest.getPassword() != null && !authRequest.getPassword().isEmpty()));

        // Check if user exists in database
        Optional<User> userByUsername = userRepository.findByUsername(authRequest.getUserName());  //
        Optional<User> userByPhone = userRepository.findByPhoneNumber(authRequest.getUserName());  //

        log.debug("User found by username: {} ", userByUsername.isPresent());
        log.debug("User found by phone: {}", userByPhone.isPresent());

        if (userByUsername.isPresent()) {
            User u = userByUsername.get();
            log.info("User ID: {}" , u.getUserId());
            log.info("Has password: {}" , (u.getPassword() != null && !u.getPassword().isEmpty()));
        } else if (userByPhone.isPresent()) {
            User u = userByPhone.get();
            log.info("User ID: {}" , u.getUserId());
            log.info("Has password: {}" , (u.getPassword() != null && !u.getPassword().isEmpty()));
        } else {
            log.debug(" User not found in database!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUserName(),
                        authRequest.getPassword()
                )
        );

        log.info(" Authentication successful");

        authenticationSuccessHandler.onAuthenticationSuccess(
                servletRequest, servletResponse, authentication
        );

        Object attribute = servletRequest.getAttribute("AUTH_RESPONSE_DATA");
        Map responseData = (attribute instanceof Map)
                ? (Map) attribute
                : new HashMap<>();

        return ResponseEntity.status(HttpStatus.OK).body(responseData);

    } catch(BadCredentialsException e) {
        log.error(" Bad credentials: {} " , e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
    } catch(Exception e) {
        log.error("Login error: {} ", e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Authentication failed: " + e.getMessage()));
    }
}

    @PostMapping("/login-phone")
    public ResponseEntity<?> loginPhone(
            @Valid @RequestBody TwoFactorRequest request,
            BindingResult result
    )
    {
        if(result.hasErrors()){
            Map<String,Object> error = new HashMap<>();
            result.getFieldErrors().forEach(f-> error.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.badRequest().body(error);
        }
        boolean initiated = this.twoFactorAuthService.initiateVerification(request.getPhoneNumber());

        TwoFactorResponse response = new TwoFactorResponse();
        response.setPhoneNumber(request.getPhoneNumber());
        response.setMessage(initiated ? "Verification code sent successfully":"Failed to send verification code");
        response.setPhoneVerified(false);
        response.setTwoFactorEnabled(false);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<?> verifyVerificationCode(
            @Valid @RequestBody TwoFactorVerification verificationRequest,
            BindingResult result,
            HttpServletResponse servletResponse
    )
    {
        if(result.hasErrors()){
            Map<String,Object> errorRes = new HashMap<>();
            result.getFieldErrors()
                    .forEach(fieldError -> errorRes.put(fieldError.getField(),fieldError.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
        boolean verified = this.twoFactorAuthService
                .verifyCode(verificationRequest.getPhoneNumber(),verificationRequest.getVerificationCode());

        if (!verified) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Verification code is incorrect"));
        }

        User user = this.userService.saveByPhoneNumber(verificationRequest.getPhoneNumber());
        UserDetails userDetails = this.userDetailsService.loadUserByUsername(user.getPhoneNumber());
        String token = this.jwtService.generateToken(userDetails);

        Cookie cookie = new Cookie("token",token);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        cookie.setSecure(false);
        cookie.setHttpOnly(true);

        servletResponse.addCookie(cookie);
        userService.updateLastSeen(user.getUserId());
        userService.updateUserStatus(user.getUserId(), UserStatus.ONLINE);
        TwoFactorResponse response = TwoFactorResponse.builder()
                .phoneVerified(true)
                .twoFactorEnabled(true)
                .message("Phone Number verified successfully")
                .phoneVerifiedAt(LocalDateTime.now())
                .phoneNumber(verificationRequest.getPhoneNumber())
                .build();

        return  ResponseEntity.status(HttpStatus.OK).body(response);
    }


    @GetMapping("/logout")
    public ResponseEntity<Map<String,String>> logout(
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse,
            Authentication authentication
    ){
        if(authentication != null && authentication.isAuthenticated()){
            User  u = (User) authentication.getPrincipal();

            userService.updateUserStatus(u.getUserId(),UserStatus.OFFLINE);
        }

        Cookie cookie = new Cookie("token",null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setMaxAge(0);
        cookie.setPath("/");

        servletResponse.addCookie(cookie);

        Map<String,String> response = new HashMap<>();

        response.put("message","Logout Successful");

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }


    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(
            @RequestHeader(name = "Authorization", required = false)String authHeader,
            HttpServletRequest request
    )
    {
        String token = null;
        if(request.getCookies() != null){
            log.debug("Number of Cookie: {}", Arrays.stream(request.getCookies()).count());
            for(Cookie c: request.getCookies()){
                if("token".equals(c.getName()) && c.getValue() != null && !c.getValue().trim().isEmpty()){
                    token = c.getValue();
                    break;
                }
            }
        }

        if(token == null && authHeader != null  && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.info("Token found in Authorization Header");

        }
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "isTokenValid", false,
                            "message", "Token is missing"
                    ));
        }

        String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "isTokenValid", false,
                            "message", "Invalid token"
                    ));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        boolean isTokenValid = jwtService.isTokenValid(token,userDetails);

        User u = (User) userDetails;

        Map<String,Object> res = new HashMap<>();
        res.put("isTokenValid", isTokenValid);
        res.put("userId", u.getUserId());

        if(!isTokenValid){

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
        }

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

}
