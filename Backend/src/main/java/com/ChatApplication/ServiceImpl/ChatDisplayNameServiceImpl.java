package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.ChatDisplayNameDTO;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.ChatNameRepository;
import com.ChatApplication.Security.AuthUtils;
import com.ChatApplication.Service.ChatDisplayNameService;
import com.ChatApplication.Entity.ChatDisplayName;
import com.ChatApplication.Entity.User;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatDisplayNameServiceImpl implements ChatDisplayNameService {
    private final ChatNameRepository chatNameRepository;
    private final ModelMapper modelMapper;
    private final AuthUtils authUtils;

    @Override
    public ChatDisplayNameDTO fetchChatName(String chatId, String userId) {
        ChatDisplayName chatDisplayName = this.chatNameRepository.findByChatIdAndUserId(chatId,userId)
                .orElseThrow(()-> new ResourceNotFoundException(" not found"));
        return modelMapper.map(chatDisplayName,ChatDisplayNameDTO.class);
    }

    @Override
    public ChatDisplayNameDTO saveChatName(String chatId, String chatName,String userId) {
        ChatDisplayName existing  = this.chatNameRepository.findByChatIdAndUserId(chatId,userId)
                .orElse(null);

        if(existing != null){
            existing.setChatname(chatName);
            ChatDisplayName updateChatName = this.chatNameRepository.save(existing);
            return  modelMapper.map(updateChatName,ChatDisplayNameDTO.class);
        }else {
            ChatDisplayName chatDisplayName = new ChatDisplayName();
            chatDisplayName.setChatId(chatId);
            chatDisplayName.setChatname(chatName);
            chatDisplayName.setUserId(userId);
            ChatDisplayName savedChatName = this.chatNameRepository.save(chatDisplayName);
            return modelMapper.map(savedChatName,ChatDisplayNameDTO.class);
        }
    }

    @Override
    public ChatDisplayNameDTO updateChatName(String chatId, String chatName, String userId) {
//        ChatDisplayName chatDisplayName = chatNameRepository.findByChatIdAndUserId(chatId, userId)
//                .orElseThrow(()-> new ResourceNotFoundException("ChatName not found."));
//        chatDisplayName.setChatname(chatName);
//        this.saveChatName()
        return null;
    }
}
