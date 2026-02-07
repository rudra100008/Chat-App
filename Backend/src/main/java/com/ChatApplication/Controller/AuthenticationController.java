
package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.CustomUserDetailService;
import com.ChatApplication.Security.JwtAuthenticationSuccessHandler;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.ImageService;
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

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthenticationController {
    private final UserService userService;
    private final JwtService jwtService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final CustomUserDetailService userDetailsService;
    private final ImageService imageService;
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
        System.out.println("=== LOGIN ATTEMPT ===");
        System.out.println("Identifier: " + authRequest.getUserName());  // ✅ Changed
        System.out.println("Password provided: " + (authRequest.getPassword() != null && !authRequest.getPassword().isEmpty()));

        // Check if user exists in database
        Optional<User> userByUsername = userRepository.findByUsername(authRequest.getUserName());  // ✅ Changed
        Optional<User> userByPhone = userRepository.findByPhoneNumber(authRequest.getUserName());  // ✅ Changed

        System.out.println("User found by username: " + userByUsername.isPresent());
        System.out.println("User found by phone: " + userByPhone.isPresent());

        if (userByUsername.isPresent()) {
            User u = userByUsername.get();
            System.out.println("User ID: " + u.getUserId());
            System.out.println("Has password: " + (u.getPassword() != null && !u.getPassword().isEmpty()));
        } else if (userByPhone.isPresent()) {
            User u = userByPhone.get();
            System.out.println("User ID: " + u.getUserId());
            System.out.println("Has password: " + (u.getPassword() != null && !u.getPassword().isEmpty()));
        } else {
            System.out.println(" User not found in database!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUserName(),
                        authRequest.getPassword()
                )
        );

        System.out.println(" Authentication successful");

        authenticationSuccessHandler.onAuthenticationSuccess(
                servletRequest, servletResponse, authentication
        );

        Object attribute = servletRequest.getAttribute("AUTH_RESPONSE_DATA");
        Map responseData = (attribute instanceof Map)
                ? (Map) attribute
                : new HashMap<>();

        return ResponseEntity.status(HttpStatus.OK).body(responseData);

    } catch(BadCredentialsException e) {
        System.err.println(" Bad credentials: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
    } catch(Exception e) {
        System.err.println("Login error: " + e.getMessage());
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



    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(
            @RequestParam("userId") String userId,
            @RequestHeader("Authorization")String authorization
    )
    {
        if(authorization == null || !authorization.startsWith("Bearer ")){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization Header");
        }
        String token = authorization.substring(7);
        String username = jwtService.extractUsername(token);
        if(username ==  null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if(!jwtService.isTokenValid(token,userDetails)){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token is invalid");
        }
        return ResponseEntity.ok(Map.of(
                "isTokenValid", true,
                "username", username
        ));
    }

}
