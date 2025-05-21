
package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.JwtService;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import com.ChatApplication.TwoFactorAuth.TwoFactorAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private final ImageService imageService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @Valid @RequestPart(value = "user") UserDTO userDTO,
            BindingResult result,
            @RequestPart(value = "image",required = false) MultipartFile imageFile
    )
    {
        String uploadDir = "E:\\Chat-App\\Chat-App\\Backend\\Images\\userImage";
        if(result.hasErrors()){
            Map<String,Object> errors = new HashMap<>();
            result.getFieldErrors().forEach(f-> errors.put(f.getField(),f.getDefaultMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
        }
        String imageName = "";
        if(imageFile != null && !imageFile.isEmpty()){
            try{
                imageName = imageService.uploadImage(uploadDir,imageFile);
            }catch (IOException e){
                return ResponseEntity.internalServerError().body("Image upload Failed:\n "+e.getMessage());
            }
        }

        userDTO.setProfile_picture(imageName);
        UserDTO postUser = userService.signup(userDTO);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(postUser);
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
            User authenticatedUser = userService.authenticate(request);
            String jwtToken = jwtService.generateToken(authenticatedUser);
            UserDetails userDetails = userDetailsService.loadUserByUsername(authenticatedUser.getUsername());
            Boolean isTokenValid = jwtService.isTokenValid(jwtToken,userDetails);
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
