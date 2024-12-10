package com.ChatApplication.DTO;


import com.ChatApplication.Enum.ChatType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDTO {
    private String chatId;
    private String chatName;
    private ChatType chatType; // GROUP,SINGLE
    private List<String> participantIds =  new ArrayList<>();
    private List<String> messageIds = new ArrayList<>();
}
