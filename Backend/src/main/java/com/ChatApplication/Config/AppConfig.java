package com.ChatApplication.Config;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.Entity.Chat;
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

import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class AppConfig  {
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    private final WebSocketAuthHandshakeInterceptor handshakeInterceptor;

    @Bean
    public ModelMapper mapper(){
        ModelMapper mapper = new ModelMapper();
        mapper.typeMap(Chat.class,ChatDTO.class).setPostConverter(context->{
            Chat chat = context.getSource();
            ChatDTO chatDTO = context.getDestination();

            chatDTO.setChatName(chat.getChatName());
            chatDTO.setChatId(chat.getChatId());
            chatDTO.setChatType(chat.getChatType());
            chatDTO.setSecureUrl(chat.getSecureUrl());
            chatDTO.setPublicId(chat.getPublicId());
            if(chat.getParticipants() != null){
                chatDTO.setParticipantIds(chat.getParticipants()
                        .stream()
                        .map(User::getUserId)
                        .toList());
            }

            return chatDTO;
        });
        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STANDARD)
                .setSkipNullEnabled(true)
                .setFieldMatchingEnabled(true);
        return mapper;
    }


}
