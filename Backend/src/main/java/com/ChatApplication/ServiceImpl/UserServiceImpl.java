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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final String DEFAULT_PROFILE_PICTURE = "default.png";
    private static final String NOT_FOUND_MESSAGE = " not found in the server";
    private static final String ALREADY_EXISTS_MESSAGE = " already exists";

    /**
     * Validates that the username is unique when updating a user
     * @param currentUsername The current username in the database
     * @param newUsername The username to be updated to
     * @throws AlreadyExistsException if the new username already exists
     */
    private void validateUsernameUniqueness(String currentUsername, String newUsername) {
        if (newUsername != null &&
                !newUsername.equals(currentUsername) &&
                userRepository.existsByUsername(newUsername)) {
            throw new AlreadyExistsException(newUsername + ALREADY_EXISTS_MESSAGE);
        }
    }

    /**
     * Validates that the email is unique when updating a user
     * @param currentEmail The current email in the database
     * @param newEmail The email to be updated to
     * @throws AlreadyExistsException if the new email already exists
     */
    private void validateEmailUniqueness(String currentEmail, String newEmail) {
        if (newEmail != null &&
                !newEmail.equals(currentEmail) &&
                userRepository.existsByEmail(newEmail)) {
            throw new AlreadyExistsException(newEmail + ALREADY_EXISTS_MESSAGE);
        }
    }

    /**
     * Validates that the phone number is unique
     * @param phoneNumber The phone number to validate
     * @throws AlreadyExistsException if the phone number already exists
     */
    private void validatePhoneNumberUniqueness(String phoneNumber) {
        if (phoneNumber != null && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new AlreadyExistsException(phoneNumber + ALREADY_EXISTS_MESSAGE);
        }
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
    public UserDTO signup(UserDTO userDTO) {
        // Validate uniqueness for username, email, and phone number
        validateUsernameUniqueness(null, userDTO.getUsername());
        validateEmailUniqueness(null, userDTO.getEmail());
        validatePhoneNumberUniqueness(userDTO.getPhoneNumber());

        // Set default values
        if (userDTO.getProfilePicture() == null || userDTO.getProfilePicture().isEmpty()) {
            userDTO.setProfilePicture(DEFAULT_PROFILE_PICTURE);
        }

        userDTO.setLastSeen(LocalDateTime.now());
        userDTO.setStatus(UserStatus.ONLINE);
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));

        // Map and save
        User user = mapper.map(userDTO, User.class);
        User savedUser = userRepository.save(user);
        return mapper.map(savedUser, UserDTO.class);
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

        // Always update last seen
        user.setLastSeen(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        return mapper.map(updatedUser, UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(userId + NOT_FOUND_MESSAGE));
        userRepository.delete(user);
    }

    @Override
    public User authenticate(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUserName(), request.getPassword())
            );
        }catch(BadCredentialsException e){
            throw new BadCredentialsException("Invalid username or password");
        }
        return userRepository.findByUsername(request.getUserName())
                .orElseThrow(() -> new ResourceNotFoundException(request.getUserName() + NOT_FOUND_MESSAGE));
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

}