package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatResponse;
import com.ChatApplication.DTO.CloudinaryResponse;
import com.ChatApplication.DTO.CreateChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Mapper.ChatMapper;
import com.ChatApplication.Mapper.UserMapper;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.*;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
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
    private final ChatMapper chatMapper;
    private  final UserMapper userMapper;
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
    public List<ChatResponse> fetchUserChats(String userId) {
        if(!StringUtils.hasText(userId)){
            throw new IllegalArgumentException("userID cannot be null or empty");
        }
        User currentUser = authenticateUser(userId);
        List<Chat>  userChats  = getAllChatOfUser(currentUser);

        return this.chatMapper.toChatResponseList(userChats);
    }

    @Override
    public ChatResponse createChat(CreateChatDTO createChatDTO) {

        Chat chat = saveChat(createChatDTO);

        User otherUser = getOtherUser(chat);

        Map<String, Object> payload = Map.of(
                "type","NEW_CHAT",
                "chat", this.chatMapper.toChatResponse(chat)
        );
        messagingTemplate.convertAndSendToUser(
                otherUser.getUserId(),
                "/queue/chats",
               payload
        );
        return this.chatMapper.toChatResponse(chat);
    }


    @Override
    @Transactional
    public ChatResponse createGroupChat(ChatResponse chatResponse) {
        User loggedInUsername = getLoggedInUser();
        if (chatResponse.getParticipantIds().size() < 3){
            throw new IllegalArgumentException("Group Chat must have at least 3 participants");
        }
        if(!StringUtils.hasText(chatResponse.getChatName())){
            throw new IllegalArgumentException("Group Chat name cannot not be empty");
        }
        if (!chatResponse.getParticipantIds().contains(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("Logged in user must be participants of the chat");
        }

        // saving the chat details in the database
        Chat chat = Chat.builder()
                .chatName(chatResponse.getChatName())
                .chatType(chatResponse.getChatType())
                .chatImageUrl(chatResponse.getChatImageUrl())
                .publicId(groupImagePublicId)
                .secureUrl(cloudFileService.getFileUrl(groupImagePublicId))
                .participantIds(chatResponse.getParticipantIds())
                .adminIds(new ArrayList<>(List.of(loggedInUsername.getUserId())))
                .createdAt(chatResponse.getCreatedAt())
                .build();

        Chat savedChat = this.chatRepository.save(chat);


        List<String> userIds = savedChat.getParticipantIds();

        // Batch update all users at once
        Query query = new Query(Criteria.where("_id").in(userIds));
        Update update = new Update().addToSet("chatIds", savedChat.getChatId());
        UpdateResult result = this.mongoTemplate.updateMulti(query, update, User.class);

        if(result.getMatchedCount() != userIds.size()){
            throw new ResourceNotFoundException("One or more users not found");
        }

        Map<String,Object> payload = Map.of(
                "type","NEW_CHAT",
                "chat", this.chatMapper.toChatResponse(savedChat)
        );
        for(String id : chat.getParticipantIds()){
            messagingTemplate.convertAndSendToUser(
                    id,
                    "/queue/chats",
                   payload
            );
        }
        return this.chatMapper.toChatResponse(savedChat);
    }

    @Override
    @Transactional
    public ChatResponse addParticipants(String chatId, String userId) {
        if(!StringUtils.hasText(chatId) || !StringUtils.hasText(userId)){
            throw new IllegalArgumentException("Chat Id and User Id is null or empty");
        }
        User loggedUser = getLoggedInUser();

        if(!this.userRepository.existsById(userId)){
            throw new ResourceNotFoundException(String.format("User Not Found: userId= %s", userId));
        }

        Query query = new Query(
                Criteria.where("_id").is(chatId)
                        .and("chatType").is(ChatType.GROUP)
                        .and("adminIds").in(loggedUser.getUserId())
        );
        Update update = new Update().addToSet("participantIds",userId);
        Chat updatedChat = this.mongoTemplate.findAndModify(query,update,Chat.class);
        if(updatedChat == null){
            throw new ResourceNotFoundException("Chat not found or not an admin");
        }


        // add chatIds in user chatIds list
        Query query1 = new Query(
                Criteria.where("_id").is(userId)
        );
        Update update1 = new Update().addToSet("chatIds",updatedChat.getChatId());
        UpdateResult result1 = this.mongoTemplate.updateFirst(query1,update1,User.class);
        if(result1.getMatchedCount() == 0){
            throw new ResourceNotFoundException("User not found or invalid type");
        }
        if (result1.getModifiedCount() == 0){
            throw new AlreadyExistsException("User already exits in chat");
        }

        this.messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/chats",
                Map.of("type","PARTICIPANTS_ADDED","chatId",chatId)
        );
        return this.chatMapper.toChatResponse(updatedChat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> fetchChatParticipants(String chatId){
        if(!StringUtils.hasText(chatId)){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);
        return this.userRepository.findAllById(chat.getParticipantIds())
                .stream().map(this.userMapper::toUserDTO)
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
    public ChatResponse deleteParticipants(String chatId, String userId) {
        if(!StringUtils.hasText(chatId) || !StringUtils.hasText(userId)){
            throw new IllegalArgumentException("chatId and userId cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), null);

        if(chat.getParticipantIds().size()<=1){
            throw new IllegalStateException("Cannot remove the last participants instead delete the chat");
        }

        // if user is not in the chat, nothing to do
        if(!chat.getParticipantIds().contains(userId)){
            return this.chatMapper.toChatResponse(chat);
        }



        chat.getParticipantIds().remove(userId);
        Chat updatedChat = this.chatRepository.save(chat);

        //update user chatIds list in db
        Query query = new Query(
                Criteria.where("_id").is(userId)
        );
        Update update = new Update().pull("chatIds",updatedChat.getChatId());
        UpdateResult result = this.mongoTemplate.updateFirst(query,update, User.class);
        if(result.getModifiedCount() == 0){
            throw new IllegalArgumentException("chatId not found in user chat list");
        }
        return this.chatMapper.toChatResponse(updatedChat);
    }

    @Override
    @Transactional
    public void deleteGroupChat(String chatId) {
        if(!StringUtils.hasText(chatId)){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        Chat chat = validateChatAccess(chatId, loggedUser.getUserId(), "You cannot delete this group chat",true);

        this.messageRepository.deleteByChat(chat);
        try{
            this.cloudFileService.deleteImage(chat.getPublicId());
        }catch (IOException e){
            throw  new ImageInvalidException("Failed to remove chat image.");
        }
        this.chatRepository.delete(chat);

    }

    @Override
    public ChatResponse fetchChatById(String chatId) {
        User loggedInUser = getLoggedInUser();
        Chat chat = validateChatAccess(chatId, loggedInUser.getUserId(),"User is not allowed to access this chat");

        return this.chatMapper.toChatResponse(chat);
    }

    @Override
    public ChatResponse updateGroupChat(ChatResponse chatResponse){
        if(chatResponse.getChatType().equals(ChatType.GROUP)) {
            User loggedUser = getLoggedInUser();
            Chat oldChat = validateChatAccess(
                    chatResponse.getChatId(),
                    loggedUser.getUserId(),
                    "You are not allowed to update this chat.",
                    true
            );


            oldChat.setChatName(chatResponse.getChatName());
            Chat newChat = chatRepository.save(oldChat);

            return this.chatMapper.toChatResponse(newChat);
        }else{
            throw new IllegalArgumentException("Chat must be GROUP chat");
        }
    }

    @Override
    public ChatResponse updateGroupChatImageInCloud(String chatId, String userId, MultipartFile imageFile)throws IOException {
        try{
            User user = authenticateUser(userId);
            Chat chat = validateChatAccess(
                    chatId,
                    user.getUserId(),
                    "You cannot update group image",
                    true
            );
            String oldPublicId = chat.getPublicId();

            CloudinaryResponse cloudinaryResponse = this.cloudFileService.uploadImageWithDetails(imageFile,"groupChat");
            chat.setPublicId(cloudinaryResponse.publicId());
            chat.setSecureUrl(cloudinaryResponse.secureUrl());
            chat = this.chatRepository.save(chat);

            this.cloudFileService.deleteImage(oldPublicId);
            return this.chatMapper.toChatResponse(chat);
        }catch(IOException e){
            throw new ImageInvalidException(String.format("Failed to update group image: %s",e.getMessage()));
        }

    }

    @Override
    public String fetchGroupImageSecureUrl(String chatId) throws IOException {
        if (!StringUtils.hasText(chatId)) {
            throw new IllegalArgumentException("chatId cannot be null or empty");
        }

        User currentUser = getLoggedInUser();
        Chat chat = validateChatAccess(chatId, currentUser.getUserId(), "User does not have access to this chat");
        
        if (!chat.getChatType().equals(ChatType.GROUP)){
            throw new IllegalArgumentException("This is only for GROUP image");
        }
        
        if (!StringUtils.hasText(chat.getSecureUrl())){
            throw new ResourceNotFoundException("Group image has no secureUrl");
        }

        String url = chat.getSecureUrl();
        if (url != null && url.contains("?")) {
            url = url.substring(0, url.indexOf("?"));
        }

        return url;
    }


    @Override
    public ChatResponse addAdminToChat(String chatId, String userId) {
        User loggedInUser = getLoggedInUser();
        Query query = new Query(
                Criteria.where("_id").is(chatId)
                        .and("adminIds").in(loggedInUser.getUserId())
                        .and("chatType").is(ChatType.GROUP)
        );
        Update update = new Update().addToSet("adminIds",userId);
        Chat updatedChat = this.mongoTemplate.findAndModify(query,update,Chat.class);
        return this.chatMapper.toChatResponse(updatedChat);
    }

//    @Override
//    public ChatResponse removeUser(String chatId, String userId) {
//        User loggedInUser = getLoggedInUser();
//        Chat chat = validateChatAccess(chatId, loggedInUser.getUserId(),"You are not allowed to remove user from group.");
//        User user = getUser(userId);
//        if(!isUserAdmin(chat,loggedInUser.getUserId())) {
//            throw new IllegalArgumentException("Insufficient permissions to remove user from chat.");
//        }
//        if(chat.getAdminIds().contains(user.getUserId())){
//            chat.getAdminIds().remove(user.getUserId());
//        }
//        chat.setParticipantIds(chat.getParticipantIds()
//                .stream()
//                .filter(ids -> !ids.equals(user.getUserId()))
//                .toList());
//        Chat updatedChat = chatRepository.save(chat);
//
//        return this.chatMapper.toChatResponse(updatedChat);
//    }

    //helper method
    // only admin can delete ,promote User to Admin,remove User from Chat
    // this method check if user is admin or not if chat is ChatType.GROUP
    private boolean isUserAdmin(Chat chat,String userId){
//        Chat fetchChat = chatRepository.findById(chatId)
//                .orElseThrow(()-> new ResourceNotFoundException("Chat not found: "+ chatId));
        if(chat.getChatType().equals(ChatType.GROUP)) {
            List<String> admins = chat.getAdminIds();
            return admins != null && admins.contains(userId);
        }
        return false;
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

//    private ChatResponse chatToDTO(Chat chat){
//        return ChatResponse.builder()
//                .chatId(chat.getChatId())
//                .chatName(chat.getChatName())
//                .chatImageUrl(chat.getChatImageUrl())
//                .chatType(chat.getChatType())
//                .participantIds(chat.getParticipantIds())
//                .createdAt(chat.getCreatedAt())
//                .lastMessage(chat.getLastMessage())
//                .lastMessageTime(chat.getLastMessageTime())
//                .adminIds(chat.getAdminIds())
//                .blockedBy(chat.getBlockedBy())
//                .build();
//    }

    private Chat validateChatAccess(String chatId,String userId,String message){
        return validateChatAccess(chatId,userId,message,false);
    }

    private Chat validateChatAccess(String chatId,String userId,String message, boolean requireAdmin){
        Chat chat = this.chatRepository.findChatByChatIdAndUserId(chatId,userId)
                .orElseThrow(()-> new AccessDeniedException(
                        message == null
                                ? "User does not have access to this chat."
                                : message
                ));

        if(requireAdmin){
            if(chat.getChatType() != ChatType.GROUP || !isUserAdmin(chat,userId)){
                throw new AccessDeniedException(
                        message == null ? "User is not allowed to perform this admin operation." : message
                );
            }
        }

        return chat;
    }

    private User authenticateUser(String userId){
        User user = this.authUtils.getLoggedInUsername();
        if(user.getUserId().equals(userId)){
            return user;
        }else{
            throw new AccessDeniedException("You are not allowed to access this service");
        }
    }

//    private Chat fetchChatByChatIdAndUserId(String chatId,String userId){
//        return this.chatRepository.findChatByChatIdAndUserId(chatId,userId)
//                .orElseThrow(()-> new ResourceNotFoundException("Chat not found or user is not in chat"));
//    }
//
//    private List<User> getParticipants(List<String> participantIds){
//        List<User> users = this.userRepository.findAllById(participantIds);
//        if(users.size() != participantIds.size()){
//            List<String> foundIds = users.stream()
//                    .map(User::getUserId)
//                    .toList();
//
//            Set<String> missingIds = participantIds
//                    .stream()
//                    .filter(ids-> !foundIds.contains(ids))
//                    .collect(Collectors.toSet());
//            throw  new ResourceNotFoundException("Users not found: "+ missingIds);
//        }
//        return users;
//    }

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
        this.userRepository.saveAll(List.of(currentUser,otherUser));
    }

    private List<Chat> getAllChatOfUser(User loginUser){
        List<String> chatIds = loginUser.getChatIds();

        return this.chatRepository.findAllById(chatIds);
    }

}
