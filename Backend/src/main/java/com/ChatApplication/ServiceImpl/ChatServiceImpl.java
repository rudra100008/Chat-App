package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.CloudinaryResponse;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final FriendService friendService;
    private final ModelMapper modelMapper;
    private final MongoTemplate mongoTemplate;
    private final AuthUtils authUtils;
    private final SimpMessagingTemplate messagingTemplate;
    private final CloudFileService cloudFileService;
    private final ChatDisplayNameService chatDisplayNameService;
    private final UserService userService;

    @Value("${publicId.default.groupChat}")
    private String groupImagePublicId;
    private static  final String NOT_FOUND = " not found.";



    @Override
    @Transactional(readOnly = true)
    public List<ChatDTO> fetchUserChats(String userId) {
        if(userId == null || userId.isEmpty()){
            throw new IllegalArgumentException("userID cannot be null or empty");
        }
        User currentUser = authenticateUser(userId);
        List<Chat>  currentUserChat  = getAllChatOfUser(currentUser);

        return currentUserChat.stream()
                .map(chat -> this.modelMapper.map(chat,ChatDTO.class))
                .toList();
    }

    @Override
    public ChatDTO createChat(CreateChatDTO createChatDTO) {

        Chat chat = saveChat(createChatDTO);

        User otherUser = getOtherUser(chat);
        messagingTemplate.convertAndSendToUser(
                otherUser.getUserId(),
                "/queue/chats",
                Map.of(
                        "type","NEW_CHAT",
                        "chat", chatToDTO(chat)
                )
        );
        return chatToDTO(chat);
    }


    @Override
    @Transactional
    public ChatDTO createGroupChat(ChatDTO chatDTO) {
        User loggedInUsername = getLoggedInUser();
        if (chatDTO.getParticipantIds().size() < 3){
            throw new IllegalArgumentException("Group Chat must have at least 3 participants");
        }
        if(!StringUtils.hasText(chatDTO.getChatName())){
            throw new IllegalArgumentException("Group Chat name cannot not be empty");
        }
        if (!chatDTO.getParticipantIds().contains(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("Logged in user must be participants of the chat");
        }

        // saving the chat details in the database
        Chat chat = Chat.builder()
                .chatName(chatDTO.getChatName())
                .chatType(chatDTO.getChatType())
                .chatImageUrl(chatDTO.getChatImageUrl())
                .publicId(groupImagePublicId)
                .secureUrl(cloudFileService.getFileUrl(groupImagePublicId))
                .participantIds(chatDTO.getParticipantIds())
                .adminIds(new ArrayList<>(List.of(loggedInUsername.getUserId())))
                .createdAt(chatDTO.getCreatedAt())
                .build();

        Chat savedChat = this.chatRepository.save(chat);

        for(String id : chat.getParticipantIds()){
            messagingTemplate.convertAndSendToUser(
                    id,
                    "/queue/chats",
                    Map.of(
                            "type","NEW_CHAT",
                            "chat", chatToDTO(savedChat)
                    )
            );
        }
        return chatToDTO(savedChat);
    }

    @Override
    @Transactional
    public ChatDTO addParticipants(String chatId, String userId) {
        if(!StringUtils.hasText(chatId) || !StringUtils.hasText(userId)){
            throw new IllegalArgumentException("Chat Id and User Id is null or empty");
        }
        User loggedUser = getLoggedInUser();
        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);

        if(chat.getChatType() == ChatType.SINGLE){
            throw new IllegalArgumentException("Cannot add participants to a single chat");
        }

        // already validated and fetched chat above
        User newUser =  getUser(userId);
        if(chat.getParticipantIds().stream().anyMatch(id-> id.equals(newUser.getUserId()))){
            throw new AlreadyExistsException("User " + newUser.getUsername() + " already exits in chat");
        }

        Query query = new Query(Criteria.where("_id").is(chatId));
        Update update = new Update().addToSet("participantIds",newUser.getUserId());
        mongoTemplate.updateFirst(query,update,Chat.class);
        chat.getParticipantIds().add(newUser.getUserId());
        return chatToDTO(chat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> fetchChatParticipants(String chatId){
        if(chatId == null || chatId.trim().isEmpty() ){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);
        return this.userRepository.findAllById(chat.getParticipantIds())
                .stream().map(user -> modelMapper.map(user,UserDTO.class))
                .toList();
    }

    @Override
    public boolean isUserInChat(String chatId, String userId) {
        if(!StringUtils.hasText(chatId) || !StringUtils.hasText(userId)){
            throw new IllegalArgumentException("ChatId and userId cannot be null or empty");
        }
        return this.chatRepository.existsByChatIdAndParticipantIds(chatId,userId);
    }

    @Override
    @Transactional
    public ChatDTO deleteParticipants(String chatId, String userId) {
        if(chatId == null || chatId.trim().isEmpty() || userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("chatId and userId cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);
        User user = this.userRepository.findById(userId)
            .orElseThrow(()-> new ResourceNotFoundException(userId + NOT_FOUND));

        if(chat.getParticipantIds().size()<=1){
            throw new IllegalStateException("Cannot remove the last participants instead delete the chat");
        }
        chat.getParticipantIds().remove(user.getUserId());
        Chat updatedChat = this.chatRepository.save(chat);
        return chatToDTO(updatedChat);
    }

    @Override
    @Transactional
    public void deleteChat(String chatId) {
        if(chatId == null || chatId.trim().isEmpty() ){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);
        if(chat.getChatType() == ChatType.GROUP) {
            if (!isUserAdmin(chat, loggedUser.getUserId())) {
                throw new AccessDeniedException(loggedUser.getUsername() + " is not allowed to delete this group.");
            }
        }
        if(chat.getChatType() == ChatType.SINGLE) {
            this.messageRepository.deleteByChat(chat);
            this.chatRepository.delete(chat);
        }else{
            if (isUserAdmin(chat,loggedUser.getUserId())){
                this.messageRepository.deleteByChat(chat);
                this.chatRepository.delete(chat);
            }
        }
    }

    @Override
    public ChatDTO fetchChatById(String chatId) {
        User loggedInUser = getLoggedInUser();
        Chat chat = validateChatAccess(chatId, loggedInUser.getUserId(),"User is not allowed to access this chat");

        return chatToDTO(chat);
    }

    @Override
    public ChatDTO updateGroupChat(ChatDTO chatDTO){
        if(chatDTO.getChatType() == ChatType.GROUP) {
            User loggedUser = getLoggedInUser();
            Chat oldChat = validateChatAccess(chatDTO.getChatId(), loggedUser.getUserId(),"You are not allowed to update this chat.");
            if (!isUserAdmin(oldChat, loggedUser.getUserId())) {
                throw new AccessDeniedException(loggedUser.getUsername() + " is not allowed to update this group.");
            }

            oldChat.setChatName(chatDTO.getChatName());
            oldChat.setChatImageUrl(chatDTO.getChatImageUrl());
            Chat newChat = chatRepository.save(oldChat);

            return chatToDTO(newChat);
        }else{
            throw new IllegalArgumentException("Chat must be group chat");
        }
    }

    @Override
    public ChatDTO updateGroupChatImageInCloud(String chatId, String userId, MultipartFile imageFile) {
        try{
            User user = authenticateUser(userId);
            Chat chat = fetchChatByChatIdAndUserId(chatId,user.getUserId());
            String oldPublicId = chat.getPublicId();
            if(chat.getChatType() == ChatType.GROUP  &&  isUserAdmin(chat,user.getUserId())){
                CloudinaryResponse cloudinaryResponse = this.cloudFileService.uploadImageWithDetails(imageFile,"groupChat");
                chat.setPublicId(cloudinaryResponse.publicId());
                chat.setSecureUrl(cloudinaryResponse.secureUrl());
                chat = this.chatRepository.save(chat);

                this.cloudFileService.deleteImage(oldPublicId);
            }
            return this.modelMapper.map(chat, ChatDTO.class);
        }catch(IOException e){
            throw new ImageInvalidException(String.format("Failed to update group image: %s",e.getMessage()));
        }

    }

    @Override
    public String fetchGroupImageSecureUrl(String chatId, String userId, MultipartFile imageFile) {
        User user = authenticateUser(userId);
        Chat chat =  fetchChatByChatIdAndUserId(chatId,user.getUserId());
        return chat.getSecureUrl();
    }

    @Override
    public ChatDTO addAdminToChat(String chatId, String userId) {
        User loggedInUser = getLoggedInUser();
        Chat fetchChat = validateChatAccess(chatId, loggedInUser.getUserId(),"You are not allowed to add admin in group");
        List<String> admins = fetchChat.getAdminIds();
        if (admins == null) {
            admins = new ArrayList<>();
        }
        if(!isUserAdmin(fetchChat,userId)){
            admins.add(userId);
        }else{
            throw new IllegalArgumentException("User is already an admin in chat");
        }
        fetchChat.setAdminIds(admins);
        Chat saveChat = this.chatRepository.save(fetchChat);
        return chatToDTO(saveChat);
    }

    @Override
    public ChatDTO removeUser(String chatId, String userId) {
        User loggedInUser = getLoggedInUser();
        Chat chat = validateChatAccess(chatId, loggedInUser.getUserId(),"You are not allowed to remove user from group.");
        User user = getUser(userId);
        if(!isUserAdmin(chat,loggedInUser.getUserId())) {
            throw new IllegalArgumentException("Insufficient permissions to remove user from chat.");
        }
        if(chat.getAdminIds().contains(user.getUserId())){
            chat.getAdminIds().remove(user.getUserId());
        }
        chat.setParticipantIds(chat.getParticipantIds()
                .stream()
                .filter(ids -> !ids.equals(user.getUserId()))
                .toList());
        Chat updatedChat = chatRepository.save(chat);

        return chatToDTO(updatedChat);
    }

    //helper method
    // only admin can delete ,promote User to Admin,remove User from Chat
    // this method check if user is admin or not if chat is ChatType.GROUP
    private boolean isUserAdmin(Chat chat,String userId){
//        Chat fetchChat = chatRepository.findById(chatId)
//                .orElseThrow(()-> new ResourceNotFoundException("Chat not found: "+ chatId));
        if(chat.getChatType() == ChatType.GROUP) {
            List<String> admins = chat.getAdminIds();
            return admins != null && admins.contains(userId);
        }
        return false;
    }

    private Chat getChat(String chatId){
        if (!StringUtils.hasText(chatId)){
            throw new IllegalArgumentException("ChatId is null or empty.");
        }
        return this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException("Chat not found: chatId= "+ chatId));
    }

    private User getUser(String userId){
        if(!StringUtils.hasText(userId)){
            throw new IllegalArgumentException("UserId is null or empty.");
        }
        return this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException("User Not Found: userId= "+ userId));
    }

    private User getLoggedInUser(){
        return authUtils.getLoggedInUsername();
    }

//    private User getOtherParticipant(ChatDTO chatDTO,User currentUser){
//        return chatDTO.getParticipantIds().stream()
//                .map(userId-> userRepository.findById(userId)
//                        .orElseThrow(()-> new ResourceNotFoundException(userId + NOT_FOUND)))
//                .filter(user-> !user.getUserId().equals(currentUser.getUserId()))
//                .findFirst()
//                .orElseThrow(()-> new ResourceNotFoundException("Other participants not found"));
//    }

    private User getOtherUser(Chat chat){
        User currentUser = this.authUtils.getLoggedInUsername();
        if (chat.getParticipantIds().contains(currentUser.getUserId())){
            String otherUserId = chat.getParticipantIds().stream()
                    .filter(id -> !id.equals(currentUser.getUserId()))
                    .findFirst()
                    .orElseThrow(()-> new ResourceNotFoundException("Other participant not found"));
            return  this.userService.fetchUserByUserId(otherUserId);
        }else{
            throw  new IllegalArgumentException("User is not in the chat");
        }
    }

    private boolean chatExistsBetweenUsers(User user1, User user2){
        return mongoTemplate.exists(Query.query(
            Criteria.where("chatType").is(ChatType.SINGLE)
                .andOperator(
                    Criteria.where("participantIds").size(2),
                    Criteria.where("participantIds").all(List.of(user1.getUserId(), user2.getUserId()))
                )
        ),Chat.class);
    }

    private ChatDTO chatToDTO(Chat chat){
        return ChatDTO.builder()
                .chatId(chat.getChatId())
                .chatName(chat.getChatName())
                .chatImageUrl(chat.getChatImageUrl())
                .chatType(chat.getChatType())
                .participantIds(chat.getParticipantIds())
                .createdAt(chat.getCreatedAt())
                .lastMessage(chat.getLastMessage())
                .lastMessageTime(chat.getLastMessageTime())
                .adminIds(chat.getAdminIds())
                .blockedBy(chat.getBlockedBy())
                .build();
    }

    private Chat validateChatAccess(String chatId,String userId,String message){
        return this.chatRepository.findChatByChatIdAndUserId(chatId,userId)
                .orElseThrow(()-> new AccessDeniedException(
                        message == null
                                ? "User does not have access to this chat."
                                : message
                ));
    }

    private User authenticateUser(String userId){
        User user = this.authUtils.getLoggedInUsername();
        if(user.getUserId().equals(userId)){
            return user;
        }else{
            throw new AccessDeniedException("You are not allowed to access this service");
        }
    }

    private Chat fetchChatByChatIdAndUserId(String chatId,String userId){
        return this.chatRepository.findChatByChatIdAndUserId(chatId,userId)
                .orElseThrow(()-> new ResourceNotFoundException("Chat not found or user is not in chat"));
    }

    private List<User> getParticipants(List<String> participantIds){
        List<User> users = this.userRepository.findAllById(participantIds);
        if(users.size() != participantIds.size()){
            List<String> foundIds = users.stream()
                    .map(User::getUserId)
                    .toList();

            Set<String> missingIds = participantIds
                    .stream()
                    .filter(ids-> !foundIds.contains(ids))
                    .collect(Collectors.toSet());
            throw  new ResourceNotFoundException("Users not found: "+ missingIds);
        }
        return users;
    }

    private Chat saveChat(CreateChatDTO createChatDTO){
        LocalDateTime now = LocalDateTime.now();
        User loginUser = authenticateUser(createChatDTO.creatorId());
        User otherUser = this.userRepository.findByPhoneNumber(createChatDTO.phoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User not found with phoneNumber: %s",createChatDTO.phoneNumber())));

        List<String>  participantIds = new ArrayList<>();
        participantIds.add(loginUser.getUserId());
        participantIds.add(otherUser.getUserId());

        if(chatExistsBetweenUsers(loginUser,otherUser)){
            throw new AlreadyExistsException(String.format("Chat already exits between %s and %s", loginUser.getUsername(),otherUser.getUsername()));
        }
        Chat  chat = Chat.builder()
                .chatName(String.format("%s & %s",loginUser.getUsername(),otherUser.getUsername()))
                .createdAt(now)
                .participantIds(participantIds)
                .chatType(ChatType.SINGLE)
                .build();
        Chat savedChat =  this.chatRepository.save(chat);

        saveChatInUser(savedChat.getChatId(), loginUser,otherUser);
        saveChatNameForBothUser(savedChat,loginUser,otherUser);
        return  savedChat;
    }

    private void saveChatNameForBothUser(Chat chat,User user1,User user2){
        if(!chat.getChatType().equals(ChatType.SINGLE) || chat.getParticipantIds().size() != 2){
            throw new IllegalArgumentException("This is only for SINGLE chat");
        }
        this.chatDisplayNameService.saveChatName(chat.getChatId(),user1.getUsername(),user2.getUserId());
        this.chatDisplayNameService.saveChatName(chat.getChatId(),user2.getUsername(),user1.getUserId());
    }


    private void saveChatInUser(String chatId,User currentUser,User otherUser){
        currentUser.getChatIds().add(chatId);
        otherUser.getChatIds().add(chatId);
        this.userRepository.save(currentUser);
        this.userRepository.save(otherUser);
    }

    private List<Chat> getAllChatOfUser(User loginUser){
        List<String> chatIds = loginUser.getChatIds();

        return this.chatRepository.findAllById(chatIds);
    }

}
