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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ModelMapper modelMapper;
    private final MongoTemplate mongoTemplate;
    private final AuthUtils authUtils;


    private void validateChatAccess(String chatId,String userId){
        if(!isUserInChat(chatId,userId)){
            throw new AccessDeniedException("User does not have access to this chat");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatDTO> fetchUserChats(String userId) {
        if(userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("userID cannot be null or empty");
        }
        User currentUser = this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+" not found."));
        List<Chat>  currentUserChat  = this.chatRepository.findByParticipants(currentUser);
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
        User loggedInUsername = this.authUtils.getLoggedInUsername();
        if (!chatDTO.getParticipantIds().contains(loggedInUsername.getUserId())) {
            throw new IllegalArgumentException("Logged in user must be a participant in the chat.");
        }

        // Find and validate all users exist
        List<User> findUser = chatDTO.getParticipantIds()
                .stream()
                .map(userId -> this.userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found in the server.")))
                .toList();

        // Check if chat already exists
        Query query = new Query(
                Criteria.where("chatType").is("SINGLE")
                        .andOperator(
                                Criteria.where("participants").size(2),
                                Criteria.where("participants").all(findUser)
                        )
        );
        boolean existsChat = mongoTemplate.exists(query, Chat.class);
        if(existsChat) {
            throw new AlreadyExistsException("Chat between these users already exists.");
        }

        // Find other user for chat naming
        User otherUser = findUser.stream()
                .filter(user -> !user.getUserId().equals(loggedInUsername.getUserId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Other user not found"));

        // Create and save chat
        Chat chat = new Chat();
        chat.setChatName(otherUser.getUsername()+" & "+loggedInUsername.getUsername());
        chat.setChatType(ChatType.SINGLE);
        chat.setParticipants(findUser);

        Chat savedChat = this.chatRepository.save(chat);

        // Convert to DTO and return
        return new ChatDTO(
                savedChat.getChatId(),
                savedChat.getChatName(),
                savedChat.getChatType(),
                savedChat.getParticipants().stream().map(User::getUserId).toList()
        );
    }

    @Override
    @Transactional
    public ChatDTO createGroupChat(ChatDTO chatDTO) {
        User loggedInUsername = authUtils.getLoggedInUsername();
        chatDTO.getParticipantIds().add(loggedInUsername.getUserId());
        if (chatDTO.getParticipantIds().size() < 3){
            throw new IllegalArgumentException("Group Chat must have at least 3 participants");
        }
        if(chatDTO.getChatName() == null || chatDTO.getChatName().trim().isEmpty()){
            throw new IllegalArgumentException("Group Chat name cannot not be empty");
        }
        if (!chatDTO.getParticipantIds().contains(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("Logged in user must be participants of the chat");
        }
       Chat chat = new Chat();
       List<User> participants = chatDTO.getParticipantIds()
               .stream()
               .map(userId->this.userRepository.findById(userId)
                       .orElseThrow(()-> new ResourceNotFoundException(userId+" not found")))
               .toList();
       // query if the chat with same participants exits in the database
       Query query = new Query(
                Criteria.where("chatType").is("GROUP")
                        .andOperator(
                                Criteria.where("participants").size(chatDTO.getParticipantIds().size()),
                                Criteria.where("participants").all(participants)
                        )
        );
        boolean existsChat = mongoTemplate.exists(query,Chat.class);
        if(existsChat){
            throw new AlreadyExistsException("A group with these exact participants already exists.");
        }

        // saving the chat details in the database
        chat.setChatType(ChatType.GROUP);
        chat.setChatName(chatDTO.getChatName());
        chat.setParticipants(participants);
        Chat savedChat = this.chatRepository.save(chat);
       return new ChatDTO(
               savedChat.getChatId(),
               savedChat.getChatName(),
               savedChat.getChatType(),
               savedChat.getParticipants().stream().map(User::getUserId).toList()
               );
    }

    @Override
    @Transactional
    public ChatDTO addParticipants(String chatId, String userId) {
        if(chatId == null || chatId.trim().isEmpty() || userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("Chat Id and User Id must not be null or empty");
        }
        User loggedUser = this.authUtils.getLoggedInUsername();
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId+" not found"));
        //Cannot add participants in the single chat
        if(chat.getChatType() != ChatType.GROUP){
            throw new IllegalArgumentException("Cannot add participants to a single chat");
        }

        // Check if the loggedIn user has permission to access the chat
        validateChatAccess(chatId,loggedUser.getUserId());

        User newuser =  this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+" not found"));
        if(chat.getParticipants().stream().noneMatch(user -> user.getUserId().equals(newuser.getUserId()))){
            Query query = new Query(Criteria.where("_id").is(chatId));
            Update update =new Update().addToSet("participants",newuser);
            this.mongoTemplate.updateFirst(query,update,Chat.class);
            Chat updatedChat = this.chatRepository.findById(chatId).orElseThrow(() ->
                    new ResourceNotFoundException(chatId + " not found"));
            return modelMapper.map(updatedChat,ChatDTO.class);
        }else {
            throw new AlreadyExistsException("User "+newuser.getUsername()+" is already in the chat group");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> fetchChatParticipants(String chatId){
        if(chatId == null || chatId.trim().isEmpty() ){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = this.authUtils.getLoggedInUsername();
        // Check if the loggedIn user has permission to access the chat
        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+ " not found"));
        return chat.getParticipants().stream()
                .map(user -> modelMapper.map(user, UserDTO.class)).toList();
    }

    @Override
    public boolean isUserInChat(String chatId, String userId) {
        if(chatId == null || chatId.trim().isEmpty()  || userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("ChatId and userId cannot be null or empty");
        }
        User user = this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException(userId+" not found."));

        this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+" not found"));
        return this.chatRepository.existsByChatIdAndParticipantsContaining(chatId,user);
    }

    @Override
    @Transactional
    public ChatDTO deleteParticipants(String chatId, String userId) {
        if(chatId == null || chatId.trim().isEmpty() || userId == null || userId.trim().isEmpty()){
            throw new IllegalArgumentException("chatId and userId cannot be null or empty");
        }
        User loggedUser = this.authUtils.getLoggedInUsername();
        // Check if the loggedIn user has permission to access the chat
        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat =  this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+"not found."));
        User user = this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException(userId+"not found"));
        if(chat.getParticipants().size()<=1){
            throw new IllegalStateException("Cannot remove the last participants instead delete the chat");
        }
        chat.getParticipants().remove(user);
        Chat updatedChat = this.chatRepository.save(chat);
        return modelMapper.map(updatedChat,ChatDTO.class);
    }

    @Override
    @Transactional
    public void deleteChat(String chatId) {
        if(chatId == null || chatId.trim().isEmpty() ){
            throw new IllegalArgumentException("chatId  cannot be null or empty");
        }
        User loggedUser = this.authUtils.getLoggedInUsername();
        // Check if the loggedIn user has permission to access the chat
        validateChatAccess(chatId,loggedUser.getUserId());

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId+"not found"));
        this.messageRepository.deleteByChat(chat);
        this.chatRepository.delete(chat);
    }

    @Override
    public ChatDTO fetchUserChat(String chatId, StompHeaderAccessor headerAccessor) {
        User loggedInUser = this.authUtils.getLoggedInUsername();
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

        return modelMapper.map(chat, ChatDTO.class);
    }

}
