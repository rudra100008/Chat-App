package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.ChatService;
import com.ChatApplication.Service.FriendService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

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

    private static  final String NOT_FOUND = " not found.";


    private void validateChatAccess(String chatId,String userId){
        if(!isUserInChat(chatId,userId)){
            throw new AccessDeniedException("User does not have access to this chat");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatDTO> fetchUserChats(String userId) {
        if(userId == null || userId.isEmpty()){
            throw new IllegalArgumentException("userID cannot be null or empty");
        }
        User currentUser = this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+ NOT_FOUND));
        List<Chat>  currentUserChat  = this.chatRepository.findByParticipants_UserIdIn(userId);
        List<ChatDTO> chatDTOS = new ArrayList<>();
        for(Chat chat: currentUserChat){
            ChatDTO chatDTO = modelMapper.map(chat,ChatDTO.class);

            if(chatDTO.getChatType()== ChatType.SINGLE){
                User otherUser = chat.getParticipants().stream()
                        .filter(user->!user.getUserId().equals(currentUser.getUserId()))
                        .findFirst()
                        .orElse(null);
                if(otherUser != null){
                    chatDTO.setChatName(otherUser.getUsername());
                }
            }
            chatDTOS.add(chatDTO);
        }
        return  chatDTOS;
    }

    @Override
    @Transactional
    public ChatDTO createChat(ChatDTO chatDTO) {
        // Validate participant count
        if(chatDTO.getParticipantIds().size() != 2) {
            throw new IllegalArgumentException("There must be two users in the chat.");
        }

        // Validate logged in user is a participant
        User loggedInUser = getLoggedInUser();
        if (!chatDTO.getParticipantIds().contains(loggedInUser.getUserId())) {
            throw new IllegalArgumentException("Logged in user must be a participant in the chat.");
        }

        User otherUser = getOtherParticipant(chatDTO,loggedInUser);

        if(chatExistsBetweenUsers(loggedInUser,otherUser)) {
            throw new AlreadyExistsException("Chat between these users already exists.");
        }
        Chat chat = Chat.builder()
                .chatName(otherUser.getUsername() + " & " + loggedInUser.getUsername())
                .chatImageUrl(otherUser.getProfilePicture())
                .chatType(ChatType.SINGLE)
                .participants(List.of(loggedInUser,otherUser))
                .build();

        Chat savedChat = this.chatRepository.save(chat);

        if(savedChat.getChatType() == ChatType.SINGLE){
            String user1 = loggedInUser.getUserId();
            String user2 = otherUser.getUserId();
            friendService.addFriend(user1,user2);

        }

        messagingTemplate.convertAndSendToUser(
                otherUser.getUserId(),
                "/queue/chats",
                Map.of(
                        "type","NEW_CHAT",
                        "chat", chatToDTO(savedChat)
                )
        );
        return chatToDTO(savedChat);
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
       List<User> participants = chatDTO.getParticipantIds()
               .stream()
               .map(userId->this.userRepository.findById(userId)
                       .orElseThrow(()-> new ResourceNotFoundException(userId+" not found in server")))
               .toList();
        // saving the chat details in the database

        Chat chat = Chat.builder()
                .chatName(chatDTO.getChatName())
                .chatType(chatDTO.getChatType())
                .chatImageUrl(chatDTO.getChatImageUrl())
                .participants(participants)
                .adminIds(new ArrayList<>(List.of(loggedInUsername.getUserId())))
                .createdAt(chatDTO.getCreatedAt())
                .build();

        Chat savedChat = this.chatRepository.save(chat);

        for(User participant : chat.getParticipants()){
            messagingTemplate.convertAndSendToUser(
                    participant.getUserId(),
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
        Chat chat = getChat(chatId);

        if(chat.getChatType() == ChatType.SINGLE){
            throw new IllegalArgumentException("Cannot add participants to a single chat");
        }

        validateChatAccess(chatId,loggedUser.getUserId());

        User newUser =  getUser(userId);
        if(chat.getParticipants().stream().anyMatch(user-> user.getUserId().equals(newUser.getUserId()))){
            throw new AlreadyExistsException("User " + newUser.getUsername() + " already exits in chat");
        }

        Query query = new Query(Criteria.where("_id").is(chatId));
        Update update = new Update().addToSet("participants",newUser);
        mongoTemplate.updateFirst(query,update,Chat.class);
        chat.getParticipants().add(newUser);
        return chatToDTO(chat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> fetchChatParticipants(String chatId){
        if(chatId == null || chatId.trim().isEmpty() ){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+ NOT_FOUND));
        return chat.getParticipants().stream()
                .map(user -> modelMapper.map(user, UserDTO.class)).toList();
    }

    @Override
    public boolean isUserInChat(String chatId, String userId) {
        if(!StringUtils.hasText(chatId) || !StringUtils.hasText(userId)){
            throw new IllegalArgumentException("ChatId and userId cannot be null or empty");
        }
        return this.chatRepository.existsByChatIdAndParticipants_UserIdIn(chatId,userId);
    }

    @Override
    @Transactional
    public ChatDTO deleteParticipants(String chatId, String userId) {
        if(chatId == null || chatId.trim().isEmpty() || userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("chatId and userId cannot be null or empty");
        }
        User loggedUser = getLoggedInUser();

        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat =  this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId + NOT_FOUND));
        User user = this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException(userId + NOT_FOUND));
        if(chat.getParticipants().size()<=1){
            throw new IllegalStateException("Cannot remove the last participants instead delete the chat");
        }
        chat.getParticipants().remove(user);
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

        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId + NOT_FOUND));
        if(chat.getChatType() == ChatType.SINGLE) {
            this.messageRepository.deleteByChat(chat);
            this.chatRepository.delete(chat);
        }else{
            if (isUserAdmin(chatId,loggedUser.getUserId())){
                this.messageRepository.deleteByChat(chat);
                this.chatRepository.delete(chat);
            }
        }
    }

    @Override
    public ChatDTO fetchUserChat(String chatId) {
        User loggedInUser = getLoggedInUser();
        validateChatAccess(chatId, loggedInUser.getUserId());

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("chat not found: " + chatId));
        if (chat.getChatType() == ChatType.SINGLE) {
            User user = chat.getParticipants().stream()
                    .filter(p -> !p.getUserId().equals(loggedInUser.getUserId()))
                    .findFirst()
                    .orElse(null);

            if (user != null) {
                chat.setChatName(user.getUsername());
            }
        }

        return chatToDTO(chat);
    }
    @Override
    public ChatDTO updateGroupChat(ChatDTO chatDTO){
        if(chatDTO.getChatType() == ChatType.GROUP) {
            Chat oldChat = chatRepository.findById(chatDTO.getChatId())
                    .orElseThrow(() -> new ResourceNotFoundException("chat not found" + chatDTO.getChatId()));
            oldChat.setChatName(chatDTO.getChatName());
            oldChat.setChatImageUrl(chatDTO.getChatImageUrl());
            Chat newChat = chatRepository.save(oldChat);

            return chatToDTO(newChat);
        }else{
            throw new IllegalArgumentException("Chat must be group chat");
        }
    }

    @Override
    public ChatDTO addAdminToChat(String chatId, String userId) {
        User loggedInUser = getLoggedInUser();
        validateChatAccess(chatId,loggedInUser.getUserId());
        Chat fetchChat = chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException("Chat not found: "+ chatId));
        List<String> admins = fetchChat.getAdminIds();
        if(!isUserAdmin(chatId,userId)){
            admins.addLast(userId);
        }else{
            throw new IllegalArgumentException("User is already an admin in chat");
        }
        fetchChat.setAdminIds(admins);
        Chat saveChat = this.chatRepository.save(modelMapper.map(fetchChat,Chat.class));
        return chatToDTO(saveChat);
    }

    @Override
    public ChatDTO removeUser(String chatId, String userId) {
        User loggedInUser = getLoggedInUser();
        validateChatAccess(chatId,loggedInUser.getUserId());
        if(!isUserAdmin(chatId,loggedInUser.getUserId())) {
            throw new IllegalArgumentException("Insufficient permissions to remove user from chat.");
        }
            Chat chat = getChat(chatId);
            User user = getUser(userId);
            if(chat.getAdminIds().contains(user.getUserId())){
                chat.getAdminIds().remove(user.getUserId());
            }
           chat.setParticipants(chat.getParticipants()
                   .stream()
                   .filter(p -> !p.getUserId().equals(user.getUserId()))
                   .toList());
            Chat updatedChat = chatRepository.save(chat);

            return chatToDTO(updatedChat);

    }

    //helper method
    // only admin can delete ,promote User to Admin,remove User from Chat
    // this method check if user is admin or not if chat is ChatType.GROUP
    private boolean isUserAdmin(String chatId,String userId){
        Chat fetchChat = chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException("Chat not found: "+ chatId));
        if(fetchChat.getChatType() == ChatType.GROUP) {
            return fetchChat.getAdminIds().contains(userId);
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

    private User getOtherParticipant(ChatDTO chatDTO,User currentUser){
        return chatDTO.getParticipantIds().stream()
                .map(userId-> userRepository.findById(userId)
                        .orElseThrow(()-> new ResourceNotFoundException(userId + NOT_FOUND)))
                .filter(user-> !user.getUserId().equals(currentUser.getUserId()))
                .findFirst()
                .orElseThrow(()-> new ResourceNotFoundException("Other participants not found"));
    }

    private boolean chatExistsBetweenUsers(User user1, User user2){
        return mongoTemplate.exists(Query.query(
                Criteria.where("chatType").is(ChatType.SINGLE)
                        .andOperator(
                                Criteria.where("participants").size(2),
                                Criteria.where("participants").all(List.of(user1,user2))
                        )
        ),Chat.class);
    }

    private ChatDTO chatToDTO(Chat chat){
        return ChatDTO.builder()
                .chatId(chat.getChatId())
                .chatName(chat.getChatName())
                .chatImageUrl(chat.getChatImageUrl())
                .chatType(chat.getChatType())
                .participantIds(chat.getParticipants().stream().map(User::getUserId).toList())
                .createdAt(chat.getCreatedAt())
                .lastMessage(chat.getLastMessage())
                .lastMessageTime(chat.getLastMessageTime())
                .adminIds(chat.getAdminIds())
                .blockedBy(chat.getBlockedBy())
                .build();
    }

}
