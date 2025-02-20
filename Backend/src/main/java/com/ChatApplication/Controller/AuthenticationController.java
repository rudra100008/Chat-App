
package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.UserService;
import com.ChatApplication.TwoFactorAuth.TwoFactorAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthenticationController {
    private final UserService userService;
    private final JwtService jwtService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final UserDetailsService userDetailsService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody UserDTO userDTO, BindingResult result) {
        if(result.hasErrors()){
            Map<String,Object> errors = new HashMap<>();
            result.getFieldErrors().forEach(f-> errors.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
        }
        UserDTO postUser = this.userService.signup(userDTO);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(postUser);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
            User authenticatedUser = this.userService.authenticate(request);
            String jwtToken = this.jwtService.generateToken(authenticatedUser);
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(authenticatedUser.getUsername());
            Boolean isTokenValid = this.jwtService.isTokenValid(jwtToken,userDetails);
            AuthResponse response = new AuthResponse(authenticatedUser,jwtToken, isTokenValid);
            return ResponseEntity.ok(response);
    }
    @PostMapping("/send")
    public ResponseEntity<?> send(
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
    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @Valid @RequestBody TwoFactorVerification info
            ,BindingResult result)
    {
        if(result.hasErrors()){
            Map<String,Object> error = new HashMap<>();
            result.getFieldErrors().forEach(f-> error.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.badRequest().body(error);
        }
        boolean verified = this.twoFactorAuthService
                .verifyCode(info.getPhoneNumber(),info.getVerificationCode());

        TwoFactorResponse response  = new TwoFactorResponse();

        response.setPhoneNumber(info.getPhoneNumber());
        response.setPhoneVerified(verified);
        response.setTwoFactorEnabled(verified);
        response.setPhoneVerifiedAt(verified? LocalDateTime.now():null);
        response.setMessage(verified ?
                "Phone number verified":
                "Failed to verify number");
        return ResponseEntity.ok(response);
    }
}
