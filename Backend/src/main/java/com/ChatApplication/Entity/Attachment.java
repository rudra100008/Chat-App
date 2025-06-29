package com.ChatApplication.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "Attachment")
public class Attachment {
    @Id
    private String attachmentId;
    private String fileName;
    private String fileType;

    @JsonProperty("url")
    public String getUrl(){
        return attachmentId != null ? "api/attachments/download/"+attachmentId : null;
    }
}
