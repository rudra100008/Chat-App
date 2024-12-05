package com.ChatApplication.Config;

import com.ChatApplication.DTO.ChatDTO;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import com.ChatApplication.Entity.User;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.stream.Collectors;

@Configuration
@EnableWebSocketMessageBroker
public class AppConfig implements WebSocketMessageBrokerConfigurer {
    @Bean
    public ModelMapper mapper(){
        ModelMapper mapper = new ModelMapper();
        mapper.createTypeMap(Message.class, MessageDTO.class)
                .addMapping(src->src.getChat().getChatId(),MessageDTO::setChatId)
                .addMapping(Message::getContent,MessageDTO::setContent)
                .addMapping(src-> src.getSender().getUser_Id(),MessageDTO::setSenderId)
                .addMapping(Message::getTimestamp,MessageDTO::setTimestamp)
                .addMapping(Message::getMessageId,MessageDTO::setMessageId);


        mapper.typeMap(Chat.class, ChatDTO.class)
                .addMapping(Chat::getChatId,ChatDTO::setChatId)
                .addMapping(Chat::getChatName,ChatDTO::setChatName)
                .setPostConverter(context -> {
            Chat source = context.getSource();
            ChatDTO destination = context.getDestination();

            if (source.getParticipants() != null) {
                destination.setParticipants(
                        source.getParticipants().stream()
                                .map(User::getUser_Id)
                                .collect(Collectors.toList())
                );
            }

            if (source.getMessages() != null) {
                destination.setMessages(
                        source.getMessages().stream()
                                .map(Message::getMessageId)
                                .collect(Collectors.toList())
                );
            }

            return destination;
        });
        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STANDARD)
                .setSkipNullEnabled(true)
                .setFieldMatchingEnabled(true);
        return mapper;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
      registry.addEndpoint("/server").setAllowedOrigins("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
       registry.enableSimpleBroker("/topic");
       registry.setApplicationDestinationPrefixes("/app");
    }
}
