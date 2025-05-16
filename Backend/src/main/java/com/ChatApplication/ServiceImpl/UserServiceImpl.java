package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.AuthRequest;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
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
    private final AuthUtils authUtils;

    private void validateUserNameUniqueness(String databaseUserName,String updatedUserName){
        boolean isUsernameChangedAndExists =
                !databaseUserName.equals(updatedUserName) &&
                        this.userRepository.existsByUserName(updatedUserName);

        if (isUsernameChangedAndExists) {
            throw new AlreadyExistsException(updatedUserName + " already exists");
        }

    }
    @Override
    public List<UserDTO> fetchAllUser() {
         return this.userRepository.findAll()
                 .stream()
                 .map(user-> mapper.map(user,UserDTO.class)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO fetchUser(String userId) {
        return this.userRepository.findById(userId)
                .map(user -> mapper.map(user,UserDTO.class))
                .orElseThrow(()-> new ResourceNotFoundException(userId +" not found in the server"));
    }

    @Override
    @Transactional
    public UserDTO signup(UserDTO userDTO) {
        if(this.userRepository.existsByUserName(userDTO.getUsername())){
            throw new AlreadyExistsException(userDTO.getUsername()+" already exists");
        }
        if(this.userRepository.existsByEmail(userDTO.getEmail())){
            throw  new AlreadyExistsException(userDTO.getEmail()+" already exists");
        }
        if(this.userRepository.existsByPhoneNumber(userDTO.getPhonenumber())){
            throw new AlreadyExistsException(userDTO.getPhonenumber()+"already exists");
        }
        if(userDTO.getProfile_picture() == null || userDTO.getProfile_picture().isEmpty()){
            userDTO.setProfile_picture("default.jpg");
        }
        userDTO.setLastSeen(LocalDateTime.now());
        userDTO.setStatus(UserStatus.Available);
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        User user = mapper.map(userDTO,User.class);
        User savedUser = this.userRepository.save(user);
        return mapper.map(savedUser,UserDTO.class);
    }
    private void validateUniqueEmail(String databaseEmail,String updatedEmail){
        boolean isEmailChangedAndExits = !databaseEmail.equals(updatedEmail)&&
                this.userRepository.existsByEmail(updatedEmail);
        if(isEmailChangedAndExits){
            throw  new AlreadyExistsException(updatedEmail+" already exists");
        }
    }
    @Override
    @Transactional
    public UserDTO updateUser(String userId, UserDTO userDTO) {
        User loggedInuser = this.authUtils.getLoggedInUsername();
        User user = this.userRepository.findById(userId).orElseThrow(()->
                new ResourceNotFoundException(userId + " not found."));
        if(!loggedInuser.getUserId().equals(user.getUserId())){
            throw new AccessDeniedException(user.getUsername()+"cannot updated this profile.");
        }
        validateUserNameUniqueness(user.getUsername(),userDTO.getUsername());
        validateUniqueEmail(user.getEmail(),userDTO.getUsername());

        if(userDTO.getPhonenumber() != null && !userDTO.getPhonenumber().equals(user.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number cannot be updated");
        }
        if(userDTO.getPassword() != null){
        }
        if(userDTO.getProfile_picture() == null || userDTO.getProfile_picture().isEmpty()){
            user.setProfilePicture("default.png");
        }else {
            user.setProfilePicture(userDTO.getProfile_picture());
        }
        Optional.ofNullable(userDTO.getUsername()).ifPresent(user::setUserName);
        Optional.ofNullable(userDTO.getEmail()).ifPresent(user::setEmail);
        Optional.ofNullable(userDTO.getPhonenumber()).ifPresent(user::setPhoneNumber);
        Optional.ofNullable(userDTO.getStatus()).ifPresent(user::setStatus);

        user.setLastSeen(LocalDateTime.now());
        User updatedUser = this.userRepository.save(user);
        return mapper.map(updatedUser,UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = this.userRepository.findById(userId).orElseThrow(()->
                new ResourceNotFoundException(userId + " not found."));
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

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return this.userRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    public User findByPhoneNumber(String phoneNumber) {
        return this.userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(()->
                        new ResourceNotFoundException("User not found with this mobileNumber: "+phoneNumber));
    }

    @Override
    public List<UserDTO> searchUser(String username) {
        List<User> users = this.userRepository
                .findByUserNameContainingIgnoreCase(username);

        if (users.isEmpty()) {
            throw new ResourceNotFoundException("No users found with username containing: " + username);
        }
        return users.stream().map(user-> mapper.map(user,UserDTO.class)).toList();
    }

}
