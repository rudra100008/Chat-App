package com.ChatApplication.Mapper;

//import com.ChatApplication.DTO.MessageDTO;
//import com.ChatApplication.Entity.Chat;
//import com.ChatApplication.Entity.Message;
//import com.ChatApplication.Entity.User;
//import org.mapstruct.InheritInverseConfiguration;
//import org.mapstruct.Mapper;
//import org.mapstruct.Mapping;
//
//@Mapper(componentModel = "spring")
public interface MessageMapper {
//    @Mapping(source = "sender" ,target = "senderId")
//    @Mapping(source = "chat", target = "chatId")
//    MessageDTO toDTO(Message message);
//    @InheritInverseConfiguration
//    Message toMessage(MessageDTO messageDTO);
//
//    default User toUser(String senderId){
//        if(senderId == null) return null;
//        User user = new User();
//        user.setUserId(senderId);
//        return user;
//    }
//
//    default Chat toChat(String chatId){
//        if(chatId == null) return null;
//        Chat chat = new Chat();
//        chat.setChatId(chatId);
//        return chat;
//    }
//
//    default String toSenderId(User user){
//        return user != null ? user.getUserId() : null;
//    }
//    default String toChatId(Chat chat) {
//        return chat != null ? chat.getChatId() : null;
//    }
}
