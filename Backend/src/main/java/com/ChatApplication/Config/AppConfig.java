package com.ChatApplication.Config;

import com.ChatApplication.DTO.ChatDTO;
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
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.stream.Collectors;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class AppConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Bean
    public ModelMapper mapper(){
        ModelMapper mapper = new ModelMapper();
        mapper.typeMap(Chat.class,ChatDTO.class).setPostConverter(context->{
            Chat chat = context.getSource();
            ChatDTO chatDTO = context.getDestination();

            chatDTO.setChatName(chat.getChatName());
            chatDTO.setChatId(chat.getChatId());
            chatDTO.setChatType(chat.getChatType());
            if(chat.getParticipants() != null){
                chatDTO.setParticipantIds(chat.getParticipants()
                        .stream()
                        .map(User::getUser_Id)
                        .collect(Collectors.toList()));
            }
            if(chat.getMessages() != null){
                chatDTO.setMessageIds(chat.getMessages().stream()
                        .map(Message::getMessageId).toList());
            }
            return chatDTO;
        });
        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STANDARD)
                .setSkipNullEnabled(true)
                .setFieldMatchingEnabled(true);
        return mapper;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/server")
                .setAllowedOrigins("http://localhost:3000")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/chatroom", "/user", "/private");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
       registration.interceptors(webSocketAuthInterceptor);
    }
}
