package com.ChatApplication.Service;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.AuthRequest;
import com.ChatApplication.Entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface UserService {
    List<UserDTO> fetchAllUser();
    UserDTO fetchUser(String user_Id);
    UserDTO signup(UserDTO userDTO);
    UserDTO updateUser(String user_id, UserDTO userDTO);
    void deleteUser(String user_id);
    User authenticate(AuthRequest request);
    boolean existsByPhoneNumber(String phoneNumber);
    User findByPhoneNumber(String phoneNumber);

}
