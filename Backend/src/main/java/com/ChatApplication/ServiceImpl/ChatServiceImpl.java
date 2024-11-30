package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.AlreadyExistsException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ModelMapper modelMapper;


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
        List<User> participants = participantsId.stream()
                .map(
                        userId->this.userRepository.findById(userId)
                                .orElseThrow(()-> new ResourceNotFoundException(userId+" not found"))
                ).toList();
        Chat chat = new Chat();
        chat.setParticipants(participants);
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
}
