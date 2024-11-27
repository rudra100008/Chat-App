package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;


    @Override
    public List<MessageDTO> fetchMessagesBySenderId(int senderId) {
        Optional<User> user = this.userRepository.findById(senderId);
        if(user.isPresent()) {
            return this.messageRepository
                    .findBySenderOrderByTimestampAsc(user.get())
                    .stream()
                    .map(message -> modelMapper.map(message, MessageDTO.class)).toList();
        }else{
            throw  new ResourceNotFoundException("Sender not found.");
        }
    }

    @Override
    public List<MessageDTO> fetchMessagesByChatId(int chatId) {
       Optional<Chat> chat =  this.chatRepository.findById(chatId);
       if(chat.isPresent()){
           return this.messageRepository.findByChatOrderByTimestampAsc(chat.get()).stream()
                   .map(message-> modelMapper.map(message,MessageDTO.class)).toList();
       }else{
           throw new ResourceNotFoundException("Chat not found");
       }
    }

    @Override
    public MessageDTO postMessage(int senderId, int chatId, String content) {
        User sender = this.userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        Message message = new Message();
        message.setSender(sender);
        message.setChat(chat);
        message.setContent(content);
        message.setTimestamp(new Timestamp(System.currentTimeMillis()));

        Message savedMessage = this.messageRepository.save(message);
        return modelMapper.map(savedMessage, MessageDTO.class);
    }

    @Override
    public MessageDTO updateMessage(int messageId, String newContent) {
        Optional<Message> existingMessage = this.messageRepository.findById(messageId);
        if(existingMessage.isPresent()){
            Message message = existingMessage.get();
            message.setChat(existingMessage.get().getChat());
            message.setSender(existingMessage.get().getSender());
            message.setContent(newContent);
            message.setTimestamp(new Timestamp(System.currentTimeMillis()));
            Message updatedMessage = this.messageRepository.save(message);
            return  modelMapper.map(updatedMessage,MessageDTO.class);
        }else{
            throw new ResourceNotFoundException("Chat or Sender not found");
        }
    }

    @Override
    public void deleteMessage(int messageId) {
        Optional<Message> message = this.messageRepository.findById(messageId);
        if (message.isPresent()){
            this.messageRepository.delete(message.get());
        }else {
            throw new ResourceNotFoundException("Message not found");
        }
    }
}
