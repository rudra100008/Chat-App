package com.ChatApplication.Config;

import com.ChatApplication.DTO.ChatResponse;
import com.ChatApplication.DTO.MessageDTO;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Entity.Message;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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

        mapper.typeMap(Chat.class, ChatResponse.class).setPostConverter(context->{
            Chat chat = context.getSource();
            ChatResponse chatResponse = context.getDestination();

            chatResponse.setChatId(chat.getChatId());
            chatResponse.setChatName(chat.getChatName());
            chatResponse.setChatImageUrl(chat.getChatImageUrl());
            chatResponse.setChatType(chat.getChatType());
            if(chat.getParticipantIds() != null){
                chatResponse.setParticipantIds(chat.getParticipantIds());
            }
            chatResponse.setCreatedAt(chat.getCreatedAt());
            chatResponse.setLastMessage(chat.getLastMessage());
            chatResponse.setLastMessageTime(chat.getLastMessageTime());
            chatResponse.setAdminIds(chat.getAdminIds());
            chatResponse.setBlockedBy(chat.getBlockedBy());
            chatResponse.setSecureUrl(chat.getSecureUrl());
            chatResponse.setPublicId(chat.getPublicId());


            return chatResponse;
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
