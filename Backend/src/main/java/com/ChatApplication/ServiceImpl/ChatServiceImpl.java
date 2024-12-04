package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.ChatName;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatNameRepository;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
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
    private final ChatNameRepository chatNameRepository;


    @Override
    @Transactional(readOnly = true)
    public List<ChatDTO> fetchUserChats(int userId) {
        User user = this.userRepository.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException(userId+" not found."));
        return this.chatRepository.findByParticipants(user)
                .stream()
                .map(participants->modelMapper.map(participants,ChatDTO.class)).toList();
    }

    @Override
    @Transactional
    public ChatDTO createChat(ChatDTO chatDTO) {
        Chat chat = new Chat();
        chat.setChatName(chatDTO.getChatName());

        // Initialize the messages list
        chat.setMessages(new ArrayList<>());

        List<User> participants = new ArrayList<>();
        for(int userId : chatDTO.getParticipants()){
            Optional<User> user = this.userRepository.findById(userId);
            user.ifPresent(participants::add);
        }
        chat.setParticipants(participants);

        Chat savedChat = this.chatRepository.save(chat);

        return new ChatDTO(
                savedChat.getChatId(),
                savedChat.getChatName(),
                savedChat.getParticipants().stream().map(User::getUser_Id).toList(),
                // Check if messages is null before streaming
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
       List<User> participants = chatDTO.getParticipants()
               .stream()
               .map(userId->this.userRepository.findById(userId)
                       .orElseThrow(()-> new ResourceNotFoundException(userId+" not found")))
               .toList();
       chat.setParticipants(participants);
       List<Message> messages = chatDTO.getMessages()
               .stream()
               .map(message->this.messageRepository.findById(message)
                       .orElseThrow(()-> new ResourceNotFoundException(message+" not found.")))
               .toList();
       chat.setMessages(messages);
       Chat savedChat = this.chatRepository.save(chat);
       return new ChatDTO(
               savedChat.getChatId(),
               savedChat.getChatName(),
               savedChat.getParticipants().stream().map(User::getUser_Id).toList(),
               savedChat.getMessages().stream().map(Message::getMessageId).toList()
               );
    }

    @Override
    public ChatDTO addParticipants(int chatId, int userId) {
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
    public List<UserDTO> fetchChatParticipants(int chatId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+ " not found"));
        return chat.getParticipants().stream()
                .map(user -> modelMapper.map(user, UserDTO.class)).toList();
    }

    @Override
    public boolean isUserInChat(int chatId, int userId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException(chatId+" not found"));
        return chat.getParticipants().stream().anyMatch(user->user.getUser_Id() == userId);
    }

    @Override
    public ChatDTO deleteParticipants(int chatId, int userId) {
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
    public void deleteChat(int chatId) {
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(()->new ResourceNotFoundException(chatId+"not found"));
        this.chatRepository.delete(chat);
    }
}
