package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.ChatName;
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
import java.util.List;

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
    public ChatDTO createChat(List<Integer> participantsId) {
        // Validate participants
        List<User> participants = participantsId.stream()
                .map(userId -> this.userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException(userId + " not found"))
                ).toList();

        // Ensure exactly two participants
        if (participants.size() != 2) {
            throw new IllegalArgumentException("Chat must have exactly two participants.");
        }

        User user1 = participants.get(0);
        User user2 = participants.get(1);

        // Create chat
        Chat chat = new Chat();
        chat.setParticipants(participants);
        Chat savedChat = this.chatRepository.save(chat);

        // Create ChatName for each user
        ChatName chatName1 = new ChatName();
        chatName1.setUser(user1);  // Important: user2's name for user1's chat
        chatName1.setChat(savedChat);
        chatName1.setChatName(user2.getUserName());

        ChatName chatName2 = new ChatName();
        chatName2.setUser(user2);  // Important: user1's name for user2's chat
        chatName2.setChat(savedChat);
        chatName2.setChatName(user1.getUserName());

        // Save ChatNames
        this.chatNameRepository.save(chatName1);
        this.chatNameRepository.save(chatName2);

        return modelMapper.map(savedChat, ChatDTO.class);
    }

    @Override
    @Transactional
    public ChatDTO createGroupChat(List<Integer> participantsId,String chatName) {
        List<User> participants = participantsId.stream()
                .map(user->this.userRepository.findById(user)
                        .orElseThrow(()-> new ResourceNotFoundException(user+" not found.")))
                .toList();
        Chat chat = new Chat();
        chat.setParticipants(participants);
        chat.setChatName(chatName);
        Chat savedChat = this.chatRepository.save(chat);
        return modelMapper.map(savedChat,ChatDTO.class);
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
