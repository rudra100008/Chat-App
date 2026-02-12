package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.CloudinaryResponse;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.DTO.UserUpdateDTO;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.UserStatus;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.CloudFileService;
import com.ChatApplication.Service.ImageService;
import com.ChatApplication.Service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
    private final CloudFileService cloudFileService;

    @Value("${image.upload.dir}")
    private String baseUrlForImage;

    private static final String DEFAULT_PROFILE_PICTURE = "default.png";
    private static final String NOT_FOUND_MESSAGE = " not found in the server";
    private static final String ALREADY_EXISTS_MESSAGE = " already exists";


    private void validateUsernameUniquenessInDatabase(String currentUsername, String newUsername) {
        if (newUsername != null &&
                !newUsername.equals(currentUsername) &&
                Boolean.TRUE.equals(userRepository.existsByUsername(newUsername))) {
            throw new AlreadyExistsException(newUsername + ALREADY_EXISTS_MESSAGE);
        }
    }


    private void validateEmailUniquenessInDatabase(String oldEmail, String newEmail) {
        if (newEmail != null &&
                !newEmail.equals(oldEmail) &&
                Boolean.TRUE.equals(userRepository.existsByEmail(newEmail))) {
            throw new AlreadyExistsException(newEmail + ALREADY_EXISTS_MESSAGE);
        }
    }


    private void validatePhoneNumberUniquenessInDatabase(String phoneNumber) {
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
        validateUsernameUniquenessInDatabase(null, userDTO.getUsername());
        validateEmailUniquenessInDatabase(null, userDTO.getEmail());
        validatePhoneNumberUniquenessInDatabase(userDTO.getPhoneNumber());

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
        }catch (IOException e) {
            throw new ImageInvalidException("Failed to upload user image: " + e.getMessage());
        }
    }


    @Override
    @Transactional
    public UserDTO updateUserImage(String userId, MultipartFile imageFile) throws IOException {
        User userToUpdate = authenticateUser(userId);

        User updatedUser = updateImage(userToUpdate,imageFile);

        return this.mapper.map(updatedUser,UserDTO.class);
    }

    @Override
    public UserDTO uploadUserImageInCloud(String userId, MultipartFile imageFile) throws IOException {
        User user = authenticateUser(userId);
        try{

            CloudinaryResponse cloudinaryResponse = this.cloudFileService.uploadImageWithDetails(imageFile,"userImage");
            user.setPublicId(cloudinaryResponse.publicId());
            user.setSecureUrl(cloudinaryResponse.secureUrl());
            User savedUser = this.userRepository.save(user);
            return this.mapper.map(savedUser,UserDTO.class);
        }catch (IOException e){
            throw new ImageInvalidException("Failed to upload user image: " + e.getMessage());
        }
    }

    @Override
    public UserDTO updateUserImageInCloud(String userId, MultipartFile imageFile) throws IOException {
        User user = authenticateUser(userId);
        return null;
    }

    @Override
    public String getUserImageInCloud(String userId) throws IOException {
        return "";
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
    public UserDTO updateUser(String userId, UserUpdateDTO userUpdateDTO) {
        User user = authenticateUser(userId);
        boolean isUpdated = false;

        if (userUpdateDTO.username() != null && !user.getUsername().equals(userUpdateDTO.username())) {
            validateUsernameUniquenessInDatabase(user.getUsername(), userUpdateDTO.username());
            user.setUsername(userUpdateDTO.username());
            isUpdated = true;
        }

        if (userUpdateDTO.email() != null && !user.getEmail().equals(userUpdateDTO.email())) {
            validateEmailUniquenessInDatabase(user.getEmail(), userUpdateDTO.email());
            user.setEmail(userUpdateDTO.email());
            isUpdated = true;
        }

        if (userUpdateDTO.about() != null && !Objects.equals(user.getAbout(), userUpdateDTO.about())) {
            user.setAbout(userUpdateDTO.about());
            isUpdated = true;
        }

        if(isUpdated) {
            user.setLastSeen(LocalDateTime.now());
        }
        User updatedUser = isUpdated ? userRepository.save(user) : user;
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

    private User authenticateUser(String userId){
        User loggedInUser = authUtils.getLoggedInUsername();
        if(loggedInUser.getUserId().equals(userId)){
            return loggedInUser;
        }else{
            throw new AccessDeniedException("You are not allowed to access this service");
        }
    }

    private User updateImage(User user,MultipartFile imageFile){
        String imageName = user.getProfilePicture();
        try{
            String baseUrl = baseUrlForImage + File.separator + "userImage";
            if (imageFile != null && !imageFile.isEmpty()){
                String imageUniqueName = this.imageService.uploadImage(baseUrl,imageFile);
                user.setProfilePicture(imageUniqueName);

                user = this.userRepository.save(user);

                deleteOldImage(baseUrl,imageName);
            }
            return user;
        }catch(IOException e){
            throw new ImageInvalidException(String.format("Failed to update user image: %s",user.getUsername()));
        }
    }


    private void deleteOldImage(String baseUrl,String imageName)throws IOException{
        if(shouldDeleteImage(imageName)){
            try {
                this.imageService.deleteImage(baseUrl, imageName);
            }catch (IOException e){
                log.info("Failed to delete old image: {}",imageName, e);
            }
        }
    }
    private boolean shouldDeleteImage(String imageName){
        return imageName != null
                && !imageName.isEmpty()
                && !"default.png".equals(imageName)
                && !"defaultGroupChat.jpg".equals(imageName);
    }


    private User  updateImageInCloud(User user, MultipartFile imageFile){
        String publicId = user.getPublicId();
        try{
            if(imageFile != null && !imageFile.isEmpty()){
                CloudinaryResponse cloudinaryResponse = this.cloudFileService.uploadImageWithDetails(imageFile,"userImage");
                user.setPublicId(cloudinaryResponse.publicId());
                user.setSecureUrl(cloudinaryResponse.secureUrl());
                user = this.userRepository.save(user);

                deleteOldImageInCloud(publicId);
            }
            return  user;
        }catch (IOException e){
            throw new ImageInvalidException(String.format("Failed to update user image in cloud: %s",user.getUsername()));
        }
    }

    private void deleteOldImageInCloud(String publicId)throws IOException{
        try{
             this.cloudFileService.deleteImage(publicId);
        }catch (IOException e){
            log.info("Failed to delete old image: {}" ,e.getMessage());
        }
    }
}