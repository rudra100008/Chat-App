package com.ChatApplication.Controller;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users") // Adjusted to follow REST conventions
public class UserController {
    private final UserService userService;



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
}