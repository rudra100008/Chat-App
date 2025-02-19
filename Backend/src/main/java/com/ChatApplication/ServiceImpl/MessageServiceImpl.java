package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.PageInfo;
import com.ChatApplication.Entity.User;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final AuthUtils authUtils;


    private void validateChatAccess(String chatId,User user){
        if(!this.chatRepository.existsByChatIdAndParticipantsContaining(chatId,user)){
            throw new AccessDeniedException("User does not have access to this chat");
        }
    }
    //this method fetch all messages send by the user
    @Override
    @Transactional(readOnly = true)
    public  PageInfo<MessageDTO> fetchMessagesBySenderId(String senderId,Integer pageNumber,Integer pageSize) {
        if(senderId == null || senderId.trim().isEmpty()){
            throw new IllegalArgumentException("SenderId should not be null or empty.");
        }
        User user = this.userRepository.findById(senderId)
                .orElseThrow(()->new ResourceNotFoundException(senderId + " not found."));
        Pageable pageable = PageRequest.of(pageNumber,pageSize,Sort.by("timestamp").ascending());
        Page<Message> messages = this.messageRepository.findBySenderOrderByTimestampAsc(user,pageable);
        List<MessageDTO> messageDTO = messages.getContent()
                .stream()
                .map(message -> modelMapper.map(message,MessageDTO.class))
                .toList();
        return new PageInfo<>(
                messageDTO,
                pageNumber,
                pageSize,
                messages.getTotalPages(),
                messages.getTotalElements(),
                messages.isLast());


    }

    @Override
    @Transactional(readOnly = true)
    public PageInfo<MessageDTO> fetchMessagesByChatId(String chatId, Integer pageNumber, Integer pageSize) {
        if(chatId == null || chatId.trim().isEmpty()) {
            throw new IllegalArgumentException("ChatId should not be null or empty.");
        }
        User loggedInUsername = this.authUtils.getLoggedInUsername();
        validateChatAccess(chatId,loggedInUsername);
       Chat chat =  this.chatRepository.findById(chatId)
               .orElseThrow(()->new ResourceNotFoundException("Chat not found."));
        Pageable pageable = PageRequest.of(pageNumber,pageSize, Sort.by("timestamp").ascending());
        Page<Message> fetchMessagesOfChat = this.messageRepository.findByChatOrderByTimestampAsc(chat,pageable);
        List<MessageDTO> messagesDTO = fetchMessagesOfChat
                .getContent()
                .stream()
                .map(message -> modelMapper.map(message,MessageDTO.class))
                .toList();
        Integer totalPage  = fetchMessagesOfChat.getTotalPages();
        Long totalElement = fetchMessagesOfChat.getTotalElements();
        Boolean lastPage = fetchMessagesOfChat.isLast();
        return new PageInfo<MessageDTO>(
                messagesDTO,
                pageNumber,
                pageSize,
                totalPage,
                totalElement,
                lastPage);
    }

    @Override
    @Transactional
    public MessageDTO postMessage(String senderId, String chatId, String content, StompHeaderAccessor headerAccessor) {
        if(senderId == null || senderId.trim().isEmpty() || chatId == null || chatId.trim().isEmpty()){
            throw  new IllegalArgumentException("senderID and chatID cannot be null or empty");
        }
        User loggedInUsername = this.authUtils.getLoggedInUserFromWebSocket(headerAccessor);
        validateChatAccess(chatId,loggedInUsername);
        User sender = this.userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        if (!senderId.equals(loggedInUsername.getUser_Id())){
            throw new IllegalArgumentException("Sender cannot access message in this chat");
        }
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if(chat.getParticipants().stream().noneMatch(user -> user.getUser_Id().equals(sender.getUser_Id()))){
            throw new IllegalArgumentException(sender.getUsername() + " is not a participant of "+chat.getChatName());
        }
        Message message = new Message();
        message.setSender(sender);
        message.setChat(chat);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());

        Message savedMessage = this.messageRepository.save(message);

        chat.getMessages().add(savedMessage);
        this.chatRepository.save(chat);
        return modelMapper.map(savedMessage, MessageDTO.class);
    }

    @Override
    @Transactional
    public MessageDTO updateMessage(String messageId, String newContent) {
        Message existingMessage = this.messageRepository
                .findById(messageId).orElseThrow(()-> new ResourceNotFoundException("Message not found."));

        User loggedInUsername = this.authUtils.getLoggedInUsername();
        validateChatAccess(existingMessage.getChat().getChatId(),loggedInUsername);

        if(!existingMessage.getSender().getUser_Id().equals(loggedInUsername.getUser_Id())){
            throw new IllegalArgumentException("You can edit only your messages.");
        }
        existingMessage.setContent(newContent);
        existingMessage.setTimestamp(LocalDateTime.now());
        Message updatedMessages = this.messageRepository.save(existingMessage);
        return modelMapper.map(updatedMessages,MessageDTO.class);

    }

    // delete the message of chat
    @Override
    @Transactional
    public void deleteMessage(String messageId) {
        Message message = this.messageRepository.findById(messageId)
                .orElseThrow(()-> new ResourceNotFoundException("message not found in the server"));
        User loggedInUsername = this.authUtils.getLoggedInUsername();

        validateChatAccess(message.getChat().getChatId(),loggedInUsername);

        if(!message.getSender().getUser_Id().equals(loggedInUsername.getUser_Id())){
            throw new IllegalArgumentException("You can delete your own messages.");
        }
        Chat chat = message.getChat();
        chat.getMessages().remove(message);
        this.chatRepository.save(chat);

        this.messageRepository.delete(message);
    }
}
