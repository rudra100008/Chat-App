package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.AuthRequest;
import com.ChatApplication.Entity.AuthResponse;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthenticationController {
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@Valid @RequestBody UserDTO userDTO) {
        UserDTO postUser = this.userService.signup(userDTO);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(postUser);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
            User authenticatedUser = this.userService.authenticate(request);
            String jwtToken = this.jwtService.generateToken(authenticatedUser);

            AuthResponse response = new AuthResponse(authenticatedUser,jwtToken);
            return ResponseEntity.ok(response);


    }
}
