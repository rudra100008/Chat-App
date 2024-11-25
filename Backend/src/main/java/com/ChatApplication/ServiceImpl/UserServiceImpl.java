package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Entity.UserStatus;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final ModelMapper mapper;

    @Override
    public List<UserDTO> fetchAllUser() {
         return this.userRepository.findAll()
                 .stream()
                 .map(user-> mapper.map(user,UserDTO.class)).toList();
    }

    @Override
    public UserDTO fetchUser(int user_Id) {
        return this.userRepository.findById(user_Id)
                .map(user -> mapper.map(user,UserDTO.class))
                .orElseThrow(()-> new ResourceNotFoundException(user_Id +"not found in the server"));
    }

    @Override
    public UserDTO postUser(UserDTO userDTO) {
        if(this.userRepository.existsByUserName(userDTO.getUserName())){
            throw new AlreadyExistsException(userDTO.getUserName()+" already exists");
        }
        if(this.userRepository.existsByEmail(userDTO.getEmail())){
            throw  new AlreadyExistsException(userDTO.getEmail()+" already exists");
        }
        if(this.userRepository.existsByPhoneNumber(userDTO.getPhoneNumber())){
            throw new AlreadyExistsException(userDTO.getPhoneNumber()+"already exists");
        }
        if(userDTO.getProfile_picture() == null || userDTO.getProfile_picture().isEmpty()){
            userDTO.setProfile_picture("default.jpg");
        }
        userDTO.setLast_seen(LocalDateTime.now());
        userDTO.setStatus(UserStatus.Available);
        User user = mapper.map(userDTO,User.class);
        User savedUser = this.userRepository.save(user);
        return mapper.map(savedUser,UserDTO.class);
    }

    @Override
    public UserDTO updateUser(int user_id, UserDTO userDTO) {
        return null;
    }

    @Override
    public void deleteUser(Integer user_id) {

    }
}
