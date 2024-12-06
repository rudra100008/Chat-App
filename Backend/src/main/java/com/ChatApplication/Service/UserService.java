package com.ChatApplication.Service;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface UserService {
    public List<UserDTO> fetchAllUser();
    public UserDTO fetchUser(String user_Id);
    public UserDTO postUser(UserDTO userDTO);
    public UserDTO updateUser(String user_id, UserDTO userDTO);
    public void deleteUser(String user_id);
}
