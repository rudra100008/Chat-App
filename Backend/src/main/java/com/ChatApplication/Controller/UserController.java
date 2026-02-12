package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.DTO.UserUpdateDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.FriendService;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@Slf4j
public class UserController {
    private final UserService userService;
    private final AuthUtils authUtils;
    private final ImageService imageService;
    private final FriendService friendService;

    @Value(("${image.upload.dir}"))
    private String baseUploadDir;


    @GetMapping("/current-user")
    public ResponseEntity<UserDTO> getCurrentUser(){
        UserDTO user = this.userService.fetchCurrentUser();
        user.setUserImageUrl(getUserImageUrl(user.getUserId()));
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
    


    @GetMapping(value = "/getUserImage/user/{userId}", produces = {MediaType.MULTIPART_FORM_DATA_VALUE,MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> getImages(@PathVariable("userId") String userId) {
        String uploadDir = baseUploadDir + File.separator + "userImage";
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            log.error("Image directory does not exist: {}", uploadDir);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Image directory not found"));
        }
        try {
            UserDTO userDTO = this.userService.fetchUser(userId);
            byte[] b = this.imageService.getImage(uploadDir, userDTO.getProfilePicture());
            return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.IMAGE_JPEG).body(b);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("Image not found: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("Error reading image: " + e.getMessage());
        }catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Unexpected error: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}/updateUserData")
    public ResponseEntity<?> updateUser(
            @PathVariable("userId")String userId,
            @Valid @RequestBody UserUpdateDTO updateDTO
            ){
        UserDTO u = this.userService.updateUser(userId,updateDTO);
        return ResponseEntity.status(HttpStatus.OK).body(u);
    }


    @PatchMapping(path = "/{userId}/updateImage",consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> updateUserImage(
            @PathVariable("userId")String userId,
            @RequestParam("imageFile")MultipartFile imageFile
    )
    {
        try{
            UserDTO userDTO = this.userService.updateUserImage(userId,imageFile);
            return ResponseEntity.status(HttpStatus.OK).body(userDTO);
        }catch(IOException e){
            throw new ImageInvalidException("Image update failed: "+ e.getMessage());
        }
    }


    @DeleteMapping("/{userId}")
    public ResponseEntity<UserDTO> deleteUser(@PathVariable String userId)throws IOException {
        UserDTO deletedUser = this.userService.fetchUser(userId);
        this.userService.deleteUser(userId);
        return ResponseEntity.ok(deletedUser);
    }

    @GetMapping("/search/{userName}")
    public ResponseEntity<List<UserDTO>> searchUser(@PathVariable(value = "userName") String userName){
        List<UserDTO> users = this.userService.searchUser(userName);
        return ResponseEntity.ok(users);
    }



    @GetMapping("/userFriends")
    public ResponseEntity<Map<String,List<String>>> fetchUserFriend(
    ){
        User loggedInUser = authUtils.getLoggedInUsername();
        List<String> friendIds = friendService.getFriends(loggedInUser.getUserId());

        return ResponseEntity.ok(Map.of("friendIds", friendIds));
    }


    //helper method
    private String getUserImageUrl(String userId){
        return "/api/users/getUserImage/user/" + userId;
    }
}