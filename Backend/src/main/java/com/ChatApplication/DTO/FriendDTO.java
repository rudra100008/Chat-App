package com.ChatApplication.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FriendDTO {
    private String id;
    private String userId; // the id that owns the friend
    private List<String> friendIds = new ArrayList<>();
    private LocalDateTime updatedAt;
}
