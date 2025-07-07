package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.ForbiddenException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Mapper.MessageMapper;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

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
    private final SimpMessagingTemplate messagingTemplate;
//    private final MessageMapper messageMapper;


    private void validateChatAccess(String chatId,User user){
        if(!this.chatRepository.existsByChatIdAndParticipants_UserIdIn(chatId,user.getUserId())){
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
        return postMessage(senderId,chatId,content,null,headerAccessor);
    }
    @Override
    @Transactional
    public MessageDTO postMessage(String senderId, String chatId, String content, Attachment attachment, StompHeaderAccessor headerAccessor) {
        validateChatIdAndSenderId(chatId,senderId);


        User loggedInUsername = this.authUtils.getLoggedInUserFromWebSocket(headerAccessor);
        validateChatAccess(chatId,loggedInUsername);
        User sender = this.userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        if (!senderId.equals(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("Sender cannot access message in this chat");
        }
        Chat chat = this.chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        if(chat.getChatType()== ChatType.SINGLE){
          validateBlockStatus(chat,senderId);
        }
        if(chat.getParticipants().stream().noneMatch(user -> user.getUserId().equals(sender.getUserId()))){
            throw new IllegalArgumentException(sender.getUsername() + " is not a participant of "+chat.getChatName());
        }
        Message message = Message.builder()
                .sender(sender)
                .chat(chat)
                .content(content)
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();
        if(attachment != null){
            message.setAttachment(attachment);
        }
        Message savedMessage = this.messageRepository.save(message);

        chat.setLastMessage(savedMessage.getContent());
        chat.setLastMessageTime(LocalDateTime.now());
        Chat updatedChat = chatRepository.save(chat);
        for(User participant : chat.getParticipants()){
            messagingTemplate.convertAndSendToUser(
                    participant.getUserId(),
                    "/queue/chat-update",
                    modelMapper.map(updatedChat, ChatDTO.class)
            );
        }
       return modelMapper.map(savedMessage, MessageDTO.class);
    }

    @Override
    @Transactional
    public MessageDTO updateMessage(String messageId, String newContent) {
        Message existingMessage = this.messageRepository
                .findById(messageId).orElseThrow(()-> new ResourceNotFoundException("Message not found."));

        User loggedInUsername = this.authUtils.getLoggedInUsername();
        validateChatAccess(existingMessage.getChat().getChatId(),loggedInUsername);

        if(!existingMessage.getSender().getUserId().equals(loggedInUsername.getUserId())){
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

        if(!message.getSender().getUserId().equals(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("You can delete your own messages.");
        }
        this.messageRepository.delete(message);
    }

    @Override
    public int countMessageByChatId(String chatId) {
        Chat chat = this.chatRepository.findById(chatId).orElseThrow(()-> new ResourceNotFoundException("chat not found."));
        return this.messageRepository.countByChat(chat);
    }

    // here senderId is own who read the message(receiver) not the sender
    @Override
    @Transactional
    public MessageDTO isRead(String messageId, String chatId, String senderId,StompHeaderAccessor headerAccessor) {
        validateChatIdAndSenderId(chatId,senderId);

        // check if user can access read message
        User loggedInUser = this.authUtils.getLoggedInUserFromWebSocket(headerAccessor);
        validateChatAccess(chatId, loggedInUser);

        if (!senderId.equals(loggedInUser.getUserId())) {
            throw new IllegalArgumentException("Invalid user access");
        }


        Message message = findByMessageId(messageId);

        if(!message.getChat().getChatId().equals(chatId)){
            throw new IllegalArgumentException("Message does not belong to this chat.");
        }

        if(!message.getSender().getUserId().equals(senderId) && !message.isRead()) {
            message.setRead(true);
            messageRepository.save(message);
        }
        return modelMapper.map(message,MessageDTO.class);
    }


    //helper function
    private String getOtherUserId(List<User> participantIds,String senderId){
        for ( User user: participantIds){
            if(!user.getUserId().equals(senderId)){
                return  user.getUserId();
            }
        }
        throw new IllegalStateException("SINGLE chat must have two participants");
    }

    private void validateBlockStatus(Chat chat,String senderId){
        String userId = getOtherUserId(chat.getParticipants(),senderId);
        if(chat.getBlockedBy() != null && chat.getBlockedBy().contains(senderId)){
            throw new ForbiddenException("You have blocked this user.Unblock to send message");
        }
        if(chat.getBlockedBy() != null && chat.getBlockedBy().contains(userId)){
            throw new ForbiddenException("You are blocked by the user. You cannot send messages");
        }
    }

    //helper method to determine last message is text or file
    private String determineLastMessage(Message message){
        if(message.getAttachment() != null){
            if(message.getContent() != null && !message.getContent().trim().isEmpty()){
                return "\nAttachment: "  + message.getAttachment().getFileName() +"\nMessage: "+ message.getContent();
            }
            return  message.getAttachment().getFileName();
        }
        return message.getContent();
    }

    private void validateChatIdAndSenderId(String chatId,String senderId){
        if(!StringUtils.hasText(senderId) || !StringUtils.hasText(chatId)){
            throw  new IllegalArgumentException("senderID and chatID cannot be null or empty");
        }
    }

    private Message findByMessageId(String messageId){
        return this.messageRepository.findById(messageId)
                .orElseThrow(()-> new ResourceNotFoundException("Message not found."));
    }
}
