package com.ChatApplication.Entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "Friend")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Friend {
    @MongoId
    private String id;
    private String userId;
    private List<String> friendIds = new ArrayList<>();
    private LocalDateTime updatedAt;
}
