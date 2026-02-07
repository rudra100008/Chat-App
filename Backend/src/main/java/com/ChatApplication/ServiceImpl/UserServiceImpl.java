package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final SimpMessagingTemplate messagingTemplate;
    private final ImageService imageService;

    @Value("${image.upload.dir}")
    private String baseUrlForImage;

    private static final String DEFAULT_PROFILE_PICTURE = "default.png";
    private static final String NOT_FOUND_MESSAGE = " not found in the server";
    private static final String ALREADY_EXISTS_MESSAGE = " already exists";


    private void validateUsernameUniqueness(String currentUsername, String newUsername) {
        if (newUsername != null &&
                !newUsername.equals(currentUsername) &&
                Boolean.TRUE.equals(userRepository.existsByUsername(newUsername))) {
            throw new AlreadyExistsException(newUsername + ALREADY_EXISTS_MESSAGE);
        }
    }


    private void validateEmailUniqueness(String currentEmail, String newEmail) {
        if (newEmail != null &&
                !newEmail.equals(currentEmail) &&
                Boolean.TRUE.equals(userRepository.existsByEmail(newEmail))) {
            throw new AlreadyExistsException(newEmail + ALREADY_EXISTS_MESSAGE);
        }
    }


    private void validatePhoneNumberUniqueness(String phoneNumber) {
        if (phoneNumber != null && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new AlreadyExistsException(phoneNumber + ALREADY_EXISTS_MESSAGE);
        }
    }

    @Override
    public UserDTO fetchCurrentUser() {
        User user = this.authUtils.getLoggedInUsername();
        return this.mapper.map(user,UserDTO.class);
    }

    @Override
    public List<UserDTO> fetchAllUser() {
        return userRepository.findAll()
                .stream()
                .map(user -> mapper.map(user, UserDTO.class))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO fetchUser(String userId) {
        return userRepository.findById(userId)
                .map(user -> mapper.map(user, UserDTO.class))
                .orElseThrow(() -> new ResourceNotFoundException(userId + NOT_FOUND_MESSAGE));
    }

    @Override
    @Transactional
    public UserDTO signup(UserDTO userDTO,MultipartFile imageFile) throws  IOException{
        // Validate uniqueness for username, email, and phone number
        validateUsernameUniqueness(null, userDTO.getUsername());
        validateEmailUniqueness(null, userDTO.getEmail());
        validatePhoneNumberUniqueness(userDTO.getPhoneNumber());

        if(imageFile == null || imageFile.isEmpty()){
            userDTO.setProfilePicture(DEFAULT_PROFILE_PICTURE);
        }


        // Map and save
        User user = mapper.map(userDTO, User.class);
        user.setLastSeen(LocalDateTime.now());
        user.setStatus(UserStatus.ONLINE);
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setAbout(userDTO.getAbout());
        User savedUser = userRepository.save(user);

        if(imageFile != null  && !imageFile.isEmpty()){
            try{
                return uploadUserImage(savedUser.getUserId(),imageFile);
            }catch (IOException e){
                throw  new ImageInvalidException("Failed to upload user image: " + e.getMessage());
            }
        }

        return this.mapper.map(savedUser,UserDTO.class);


    }

    @Override
    public UserDTO uploadUserImage(String userId, MultipartFile multipartFile) throws IOException {
        if(multipartFile == null || multipartFile.isEmpty()){
            throw new ImageInvalidException("Image file is empty");
        }
        User user =  getUserById(userId);
        try {
            String baseUrl = baseUrlForImage + File.separator + "userImage";
            String uniqueName = this.imageService.uploadImage(baseUrl,multipartFile);
            user.setProfilePicture(uniqueName);
            User savedUser = this.userRepository.save(user);

            return this.mapper.map(savedUser,UserDTO.class);
        }catch (IOException e){
            throw  new ImageInvalidException("Failed to upload user image: " + e.getMessage());
        }

    }

    @Override
    public User saveByPhoneNumber(String phoneNumber) {
        User user = User.builder()
                .phoneNumber(phoneNumber)
                .status(UserStatus.OFFLINE)
                .username(phoneNumber)
                .build();
        return this.userRepository.save(user);
    }

    @Override
    @Transactional
    public UserDTO updateUser(String userId, UserDTO userDTO) {
        // Get loggedIn user and verify access
        User loggedInUser = authUtils.getLoggedInUsername();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(userId + NOT_FOUND_MESSAGE));

        if (!Objects.equals(loggedInUser.getUserId(), user.getUserId())) {
            throw new AccessDeniedException("You cannot update this profile");
        }

        // Validate unique fields
        validateUsernameUniqueness(user.getUsername(), userDTO.getUsername());
        validateEmailUniqueness(user.getEmail(), userDTO.getEmail());

        // Phone number cannot be updated
        if (userDTO.getPhoneNumber() != null && !userDTO.getPhoneNumber().equals(user.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number cannot be updated");
        }

        // Update profile picture
        String profilePicture = (userDTO.getProfilePicture() == null || userDTO.getProfilePicture().isEmpty())
                ? DEFAULT_PROFILE_PICTURE
                : userDTO.getProfilePicture();
        user.setProfilePicture(profilePicture);

        // Update other fields if provided
        Optional.ofNullable(userDTO.getUsername()).ifPresent(user::setUsername);
        Optional.ofNullable(userDTO.getEmail()).ifPresent(user::setEmail);
        Optional.ofNullable(userDTO.getStatus()).ifPresent(user::setStatus);
        Optional.ofNullable(userDTO.getAbout()).ifPresent(user::setAbout);

        // Always update last seen
        user.setLastSeen(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        return mapper.map(updatedUser, UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(String userId)throws  IOException {
        String baseUrl = baseUrlForImage + File.pathSeparator + "userImage";
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(userId + NOT_FOUND_MESSAGE));
        this.imageService.deleteImage(baseUrl,user.getProfilePicture());
        userRepository.delete(user);
    }


    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return userRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    public User findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with phone number: " + phoneNumber));
    }

    @Override
    public List<UserDTO> searchUser(String username) {
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(username);

        if (users.isEmpty()) {
            throw new ResourceNotFoundException("No users found with username containing: " + username);
        }

        return users.stream()
                .map(user -> mapper.map(user, UserDTO.class))
                .toList();
    }

    @Override
    public void updateLastSeen(String userId) {
        userRepository.findById(userId)
                .ifPresent(user -> {
                    user.setLastSeen(LocalDateTime.now());
                    userRepository.save(user);
                });
    }

    @Override
    public void updateUserStatus(String userId,UserStatus status){
        userRepository.findById(userId).ifPresent(user->{
            user.setStatus(status);
            userRepository.save(user);
        });
    }

    @Override
    public User fetchUserByUserId(String userId) {
       return userRepository.findById(userId)
               .orElseThrow(()->new ResourceNotFoundException("user not found in server"));

    }

    public void broadCastUserStatus(String userId,UserStatus status,String username){
        Map<String,Object> statusUpdate = Map.of(
                "type","USER_STATUS_UPDATE",
                "userId",userId,
                "username",username,
                "status",status.toString(),
                "lastSeen",LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/user-status", statusUpdate);
    }


    // private helper method
    private User getUserById(String userId){
        return this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException("User not found"));
    }

}