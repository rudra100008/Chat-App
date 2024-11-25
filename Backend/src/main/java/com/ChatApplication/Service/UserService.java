package com.ChatApplication.Service;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface UserService {
    public List<UserDTO> fetchAllUser();
    public UserDTO fetchUser(int user_Id);
    public UserDTO postUser(UserDTO userDTO);
    public UserDTO updateUser(int user_id, UserDTO userDTO);
    public void deleteUser(Integer user_id);
}
