package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatNameRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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


    @Override
    @Transactional(readOnly = true)
    public List<ChatDTO> fetchUserChats(String userId) {
        User user = this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+" not found."));
        return this.chatRepository.findByParticipants(user)
                .stream()
                .map(chat->modelMapper.map(chat,ChatDTO.class)).toList();
    }

    @Override
    @Transactional
    public ChatDTO createChat(ChatDTO chatDTO) {
        if(chatDTO.getParticipantIds().size() != 2){
            throw new IllegalArgumentException("There must be two user in the chat.");
        }

        User loggedInUsername = this.authUtils.getLoggedInUsername();

        Chat chat = new Chat();
        List<User> findUser = chatDTO.getParticipantIds()
                .stream()
                .map(userId->this.userRepository.findById(userId)
                        .orElseThrow(()-> new ResourceNotFoundException("user not found in the server.")))
                .toList();
        Query query = new Query(
                Criteria.where("chatType").is("SINGLE")
                        .andOperator(
                                Criteria.where("participants").size(2),
                                Criteria.where("participants").all(findUser)
                        )
        );
        boolean existsChat = mongoTemplate.exists(query,Chat.class);
        if(existsChat){
            throw new AlreadyExistsException("Chat between these participants already exists.");
        }

      User otherUser = findUser.stream()
              .filter(user->!user.getUser_Id().equals(loggedInUsername.getUser_Id()))
              .findFirst()
              .orElseThrow(()-> new ResourceNotFoundException("Other not found"));

        chat.setChatName(otherUser.getUsername());
        chat.setChatType(ChatType.SINGLE);
        chat.setMessages(new ArrayList<>());

        List<User> participants = new ArrayList<>();
        for(String userId : chatDTO.getParticipantIds()){
            Optional<User> user = this.userRepository.findById(userId);
            user.ifPresent(participants::add);
        }
        chat.setParticipants(participants);

        Chat savedChat = this.chatRepository.save(chat);

        return new ChatDTO(
                savedChat.getChatId(),
                savedChat.getChatName(),
                savedChat.getChatType(),
                savedChat.getParticipants().stream().map(User::getUser_Id).toList(),
                savedChat.getMessages() != null
                        ? savedChat.getMessages().stream().map(Message::getMessageId).toList()
                        : Collections.emptyList()
        );
    }

    @Override
    @Transactional
    public ChatDTO createGroupChat(ChatDTO chatDTO) {

       Chat chat = new Chat();
       chat.setChatName(chatDTO.getChatName());
       chat.setChatType(ChatType.GROUP);
       List<User> participants = chatDTO.getParticipantIds()
               .stream()
               .map(userId->this.userRepository.findById(userId)
                       .orElseThrow(()-> new ResourceNotFoundException(userId+" not found")))
               .toList();
       chat.setParticipants(participants);
       List<Message> messages = chatDTO.getMessageIds()
               .stream()
               .map(message->this.messageRepository.findById(message)
                       .orElseThrow(()-> new ResourceNotFoundException(message+" not found.")))
               .toList();
       chat.setMessages(messages);
       Chat savedChat = this.chatRepository.save(chat);
       return new ChatDTO(
               savedChat.getChatId(),
               savedChat.getChatName(),
               savedChat.getChatType(),
               savedChat.getParticipants().stream().map(User::getUser_Id).toList(),
               savedChat.getMessages().stream().map(Message::getMessageId).toList()
               );
    }

    @Override
    public ChatDTO addParticipants(String chatId, String userId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId+" not found"));
        User user =  this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+" not found"));
        if(!chat.getParticipants().contains(user)){
            chat.getParticipants().add(user);
            Chat updatedChat = this.chatRepository.save(chat);
            return modelMapper.map(updatedChat,ChatDTO.class);
        }else {
            throw new AlreadyExistsException("This user already exists in the chat");
        }
    }

    @Override
    public List<UserDTO> fetchChatParticipants(String chatId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+ " not found"));
        return chat.getParticipants().stream()
                .map(user -> modelMapper.map(user, UserDTO.class)).toList();
    }

    @Override
    public boolean isUserInChat(String chatId, String userId) {
        if(chatId == null || userId == null){
            throw new IllegalArgumentException("ChatId and userId should not be null.");
        }
        User user = this.userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException(userId+" not found."));

        this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+" not found"));
        return this.chatRepository.existsByChatIdAndParticipants(chatId,user);
    }

    @Override
    public ChatDTO deleteParticipants(String chatId, String userId) {
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
    public void deleteChat(String chatId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId+"not found"));
        this.messageRepository.deleteByChat(chat);
        this.chatRepository.delete(chat);
    }
}
