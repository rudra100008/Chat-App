package com.ChatApplication.Config;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class AppConfig  {
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    private final WebSocketAuthHandshakeInterceptor handshakeInterceptor;

    @Bean
    public ModelMapper mapper(){
        ModelMapper mapper = new ModelMapper();

        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true)
                .setFieldMatchingEnabled(true);

        mapper.typeMap(Chat.class,ChatDTO.class).setPostConverter(context->{
            Chat chat = context.getSource();
            ChatDTO chatDTO = context.getDestination();

            chatDTO.setChatId(chat.getChatId());
            chatDTO.setChatName(chat.getChatName());
            chatDTO.setChatImageUrl(chat.getChatImageUrl());
            chatDTO.setChatType(chat.getChatType());
            if(chat.getParticipantIds() != null){
                chatDTO.setParticipantIds(chat.getParticipantIds());
            }
            chatDTO.setCreatedAt(chat.getCreatedAt());
            chatDTO.setLastMessage(chat.getLastMessage());
            chatDTO.setLastMessageTime(chat.getLastMessageTime());
            chatDTO.setAdminIds(chat.getAdminIds());
            chatDTO.setBlockedBy(chat.getBlockedBy());
            chatDTO.setSecureUrl(chat.getSecureUrl());
            chatDTO.setPublicId(chat.getPublicId());


            return chatDTO;
        });

        mapper.typeMap(Message.class, MessageDTO.class).setPostConverter(context ->{
            Message message = context.getSource();
            MessageDTO messageDTO = context.getDestination();

            if (message.getMessageId() != null){
                messageDTO.setMessageId(message.getMessageId());
            }

            messageDTO.setContent(message.getContent());

            messageDTO.setTimestamp(message.getTimestamp());
            messageDTO.setRead(message.isRead());
            messageDTO.setSenderId(
                    message.getSender().getUserId() != null
                            ? message.getSender().getUserId()
                            : null
            );
            messageDTO.setChatId(
                    message.getChat().getChatId() != null
                            ? message.getChat().getChatId()
                            : null
            );

            if(message.getAttachment() != null) {
                messageDTO.setAttachment(message.getAttachment());
            }

            return messageDTO;
        });

        return mapper;
    }


}
