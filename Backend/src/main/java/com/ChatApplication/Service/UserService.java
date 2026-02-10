package com.ChatApplication.Service;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.DTO.UserUpdateDTO;
import com.ChatApplication.Entity.AuthRequest;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public interface UserService {
    UserDTO fetchCurrentUser();
    List<UserDTO> fetchAllUser();
    UserDTO fetchUser(String user_Id);
    UserDTO signup(UserDTO userDTO,MultipartFile imageFile)throws IOException;

    // service method to get and save user image
    UserDTO uploadUserImage(String userId, MultipartFile multipartFile)throws IOException;
    UserDTO updateUserImage(String userId,MultipartFile imageFile)throws IOException;

    User saveByPhoneNumber(String phoneNumber);
    UserDTO updateUser(String userId, UserUpdateDTO userUpdateDTO);
    void deleteUser(String userId)throws IOException;
    boolean existsByPhoneNumber(String phoneNumber);
    User findByPhoneNumber(String phoneNumber);
    List<UserDTO> searchUser(String username);
    void updateLastSeen(String userId);
    void updateUserStatus(String userId, UserStatus status);
    User fetchUserByUserId(String userId);
    void broadCastUserStatus(String userId,UserStatus status,String username);

}
