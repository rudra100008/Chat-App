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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final ModelMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> fetchAllUser() {
         return this.userRepository.findAll()
                 .stream()
                 .map(user-> mapper.map(user,UserDTO.class)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO fetchUser(int user_Id) {
        return this.userRepository.findById(user_Id)
                .map(user -> mapper.map(user,UserDTO.class))
                .orElseThrow(()-> new ResourceNotFoundException(user_Id +"not found in the server"));
    }

    @Override
    @Transactional
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
    @Transactional
    public UserDTO updateUser(int user_id, UserDTO userDTO) {
        User user = this.userRepository.findById(user_id).orElseThrow(()->
                new ResourceNotFoundException(user_id + " not found."));
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
            user.setProfile_picture("default.jpg");
        }

        Optional.ofNullable(userDTO.getUserName()).ifPresent(user::setUserName);
        Optional.ofNullable(userDTO.getEmail()).ifPresent(user::setEmail);
        Optional.ofNullable(userDTO.getPhoneNumber()).ifPresent(user::setPhoneNumber);
        Optional.ofNullable(userDTO.getStatus()).ifPresent(user::setStatus);

        userDTO.setLast_seen(LocalDateTime.now());
        user.setPassword(user.getPassword());

        User updatedUser = this.userRepository.save(user);
        return mapper.map(updatedUser,UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(Integer user_id) {
        User user = this.userRepository.findById(user_id).orElseThrow(()->
                new ResourceNotFoundException(user_id + " not found."));
        this.userRepository.delete(user);
    }
}
