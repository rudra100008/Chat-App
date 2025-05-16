package com.ChatApplication.Entity;


import com.ChatApplication.Enum.ChatType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.List;

@Document(collection = "Chat")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Chat {
    @MongoId
    private String chatId;
    private String  chatName; //only for GROUP chat
    private ChatType chatType; //SINGLE,GROUP
    private List<User> participants;

}
