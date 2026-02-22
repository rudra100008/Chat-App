package com.ChatApplication.Mapper;

import com.ChatApplication.DTO.ChatResponse;
import com.ChatApplication.Entity.Chat;
import com.ChatApplication.Resolver.UserResolver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserResolver.class})
public interface ChatMapper {

    ChatResponse toChatResponse(Chat chat);

    List<ChatResponse> toChatResponseList(List<Chat> chats);

    Chat toChat(ChatResponse chatResponse);


    @Mapping(target = "chatId",ignore = true)
    void updateFromChat(ChatResponse chatResponse, @MappingTarget Chat chat);
}
