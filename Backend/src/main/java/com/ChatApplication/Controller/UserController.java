package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users") // Adjusted to follow REST conventions
public class UserController {
    private final UserService userService;
    private final AuthUtils authUtils;
    private final ImageService imageService;

    Logger logger  = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/current-user")
    public ResponseEntity<User> getCurrentUser(){
        User user = authUtils.getLoggedInUsername();
        return ResponseEntity.ok(user);
    }
    @GetMapping
    public ResponseEntity<List<UserDTO>> fetchAllUsers() {
        List<UserDTO> userDTOs = this.userService.fetchAllUser();
        return ResponseEntity.ok(userDTOs);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> fetchByUserId(@PathVariable String userId) {
        UserDTO userDTO = this.userService.fetchUser(userId);
        return ResponseEntity.ok(userDTO);
    }
    
//    @PostMapping("/userImages")
//    public ResponseEntity<?> uploadImages(@RequestParam() MultipartFile imageFile){
//        String uploadDir = "D:\\Chat-App\\Backend\\Images\\userImage";
//        String uniqueName;
//        try {
//             uniqueName = this.imageService.uploadImage(uploadDir, imageFile);
//
//        }catch (IOException io){
//            return ResponseEntity.badRequest().body("Error in handling image:\n "+io.getMessage());
//        }
//        return  ResponseEntity.ok("Image upload successful:"+ uniqueName );
//    }

    @GetMapping(value = "/getUserImage/user/{userId}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<?> getImages(@PathVariable("userId") String userId) {
        try {
            UserDTO userDTO = this.userService.fetchUser(userId);
            logger.debug("Profile_Picture:{}",userDTO.getProfile_picture());

            String uploadDir = "D:\\Chat-App\\Backend\\Images\\userImage";
            byte[] b = this.imageService.getImage(uploadDir, userDTO.getProfile_picture());
            return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.IMAGE_JPEG).body(b);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Image not found: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error reading image: " + e.getMessage());
        }
    }


    @PatchMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = this.userService.updateUser(userId, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<UserDTO> deleteUser(@PathVariable String userId) {
        UserDTO deletedUser = this.userService.fetchUser(userId);
        this.userService.deleteUser(userId);
        return ResponseEntity.ok(deletedUser);
    }
    @GetMapping("/search/{userName}")
    public ResponseEntity<List<UserDTO>> searchUser(@PathVariable(value = "userName") String userName){
        List<UserDTO> users = this.userService.searchUser(userName);
        return ResponseEntity.ok(users);
    }
}