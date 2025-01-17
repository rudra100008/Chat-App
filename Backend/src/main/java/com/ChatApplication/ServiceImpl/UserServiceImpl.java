package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.AuthRequest;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
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
    public UserDTO fetchUser(String user_Id) {
        return this.userRepository.findById(user_Id)
                .map(user -> mapper.map(user,UserDTO.class))
                .orElseThrow(()-> new ResourceNotFoundException(user_Id +"not found in the server"));
    }

    @Override
    @Transactional
    public UserDTO signup(UserDTO userDTO) {
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
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        User user = mapper.map(userDTO,User.class);
        User savedUser = this.userRepository.save(user);
        return mapper.map(savedUser,UserDTO.class);
    }

    @Override
    @Transactional
    public UserDTO updateUser(String user_id, UserDTO userDTO) {
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
        if(userDTO.getPassword() != null){
            throw new IllegalArgumentException("The password cannot be updated.");
        }
        if(userDTO.getProfile_picture() == null || userDTO.getProfile_picture().isEmpty()){
            user.setProfile_picture("default.jpg");
        }else {
            user.setProfile_picture(userDTO.getProfile_picture());
        }

        Optional.ofNullable(userDTO.getUserName()).ifPresent(user::setUserName);
        Optional.ofNullable(userDTO.getEmail()).ifPresent(user::setEmail);
        Optional.ofNullable(userDTO.getPhoneNumber()).ifPresent(user::setPhoneNumber);
        Optional.ofNullable(userDTO.getStatus()).ifPresent(user::setStatus);

        userDTO.setLast_seen(LocalDateTime.now());
        User updatedUser = this.userRepository.save(user);
        return mapper.map(updatedUser,UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(String user_id) {
        User user = this.userRepository.findById(user_id).orElseThrow(()->
                new ResourceNotFoundException(user_id + " not found."));
        this.userRepository.delete(user);
    }

    @Override
    public User authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUserName(),request.getPassword())
        );
        return this.userRepository.findByUserName(request.getUserName())
                .orElseThrow(()-> new ResourceNotFoundException(request.getUserName()+" not found in server"));
    }

}
