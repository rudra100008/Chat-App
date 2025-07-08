package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.*;
import com.ChatApplication.Enum.ChatType;
import com.ChatApplication.Exception.ForbiddenException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatRepository;
import com.ChatApplication.Repository.MessageRepository;
import com.ChatApplication.Repository.UserRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
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



    private void validateChatAccess(Chat chat,User user){
        if(chat.getParticipants().stream().noneMatch(u-> u.getUserId().equals(user.getUserId()))){
            throw new AccessDeniedException("User does not have access to this chat");
        }
    }
    //this method fetch all messages send by the user
    @Override
    @Transactional(readOnly = true)
    public  PageInfo<MessageDTO> fetchMessagesBySenderId(String senderId,Integer pageNumber,Integer pageSize) {
        if(!StringUtils.hasText(senderId)){
            throw new IllegalArgumentException("SenderId should not be null or empty.");
        }
        User user = getUser(senderId);
        Pageable pageable = PageRequest.of(pageNumber,pageSize,Sort.by("timestamp").ascending());
        Page<Message> messages = this.messageRepository.findBySenderOrderByTimestampAsc(user,pageable);
        List<MessageDTO> messageDTO = mapToDTO(messages);
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
        if(!StringUtils.hasText(chatId)) {
            throw new IllegalArgumentException("ChatId should not be null or empty.");
        }
        User loggedInUsername = this.authUtils.getLoggedInUsername();
        Chat chat =  getChat(chatId);

        validateChatAccess(chat,loggedInUsername);

        Pageable pageable = PageRequest.of(pageNumber,pageSize, Sort.by("timestamp").ascending());
        Page<Message> fetchMessagesOfChat = messageRepository.findByChatOrderByTimestampAsc(chat,pageable);
        List<MessageDTO> messagesDTO = mapToDTO(fetchMessagesOfChat);
        Integer totalPage  = fetchMessagesOfChat.getTotalPages();
        Long totalElement = fetchMessagesOfChat.getTotalElements();
        Boolean lastPage = fetchMessagesOfChat.isLast();
        return new PageInfo<>(
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
        return postMessageInternal(senderId,chatId,content,null,headerAccessor);
    }
    @Override
    @Transactional
    public MessageDTO postMessage(String senderId, String chatId, String content, Attachment attachment, StompHeaderAccessor headerAccessor) {
        return postMessageInternal(senderId,chatId,content,attachment,headerAccessor);
    }

    private MessageDTO postMessageInternal(String senderId, String chatId, String content, Attachment attachment, StompHeaderAccessor headerAccessor) {
        validateNotBlankChatIdAndSenderId(chatId,senderId);

        User sender = getUser(senderId);
        Chat chat = getChat(chatId);

        validateChatAccess(chat,sender);

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
        Message savedMessage = messageRepository.save(message);

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
        Message existingMessage = messageRepository
                .findById(messageId).orElseThrow(()-> new ResourceNotFoundException("Message not found."));

        User loggedInUsername = authUtils.getLoggedInUsername();
        validateChatAccess(existingMessage.getChat(),loggedInUsername);

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

        validateChatAccess(message.getChat(),loggedInUsername);

        if(!message.getSender().getUserId().equals(loggedInUsername.getUserId())){
            throw new IllegalArgumentException("You can delete your own messages.");
        }
        this.messageRepository.delete(message);
    }

    @Override
    public int countMessageByChatId(String chatId) {
        Chat chat = getChat(chatId);
        return this.messageRepository.countByChat(chat);
    }


    @Override
    @Transactional
    public MessageDTO isRead(String messageId, String chatId, String readerId,StompHeaderAccessor headerAccessor) {
        validateNotBlankChatIdAndSenderId(chatId,readerId);

        // check if user can access read message
        User loggedInUser = this.authUtils.getLoggedInUserFromWebSocket(headerAccessor);
        validateChatAccess(getChat(chatId), loggedInUser);

        if (!readerId.equals(loggedInUser.getUserId())) {
            throw new IllegalArgumentException("Invalid user access");
        }


        Message message = findByMessageId(messageId);

        if(!message.getChat().getChatId().equals(chatId)){
            throw new IllegalArgumentException("Message does not belong to this chat.");
        }

        if(!message.getSender().getUserId().equals(readerId) && !message.isRead()) {
            message.setRead(true);
            messageRepository.save(message);
        }
        return modelMapper.map(message,MessageDTO.class);
    }


    //helper functions

    // this function gets otherUserId
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

    private void validateNotBlankChatIdAndSenderId(String chatId,String senderId){
        if(!StringUtils.hasText(senderId) || !StringUtils.hasText(chatId)){
            throw new IllegalArgumentException("Invalid input: chatId=" + chatId + ", senderId=" + senderId);
        }
    }

    private Message findByMessageId(String messageId){
        return this.messageRepository.findById(messageId)
                .orElseThrow(()-> new ResourceNotFoundException("Message not found."));
    }

    private List<MessageDTO> mapToDTO(Page<Message> messagePage){
       return  messagePage
                .getContent()
                .stream()
                .map(message -> modelMapper.map(message,MessageDTO.class)).toList();
    }

    private User getUser(String userId){
        return  userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException("Not found: userId= "+ userId));
    }

    private  Chat getChat(String chatId){
        return chatRepository.findById(chatId)
                .orElseThrow(()-> new ResourceNotFoundException("Not found: chatId= "+chatId));
    }
}
