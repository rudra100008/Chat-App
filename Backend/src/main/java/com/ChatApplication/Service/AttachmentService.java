package com.ChatApplication.Service;

import com.ChatApplication.Entity.Attachment;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public interface AttachmentService {
    Attachment uploadAttachment( MultipartFile file);
    Resource downloadAttachment(String attachmentId);
    void deleteAttachment(String attachmentId);

    Attachment uploadAttachmentToCloud(MultipartFile file)throws IOException,Exception;

    Resource downloadAttachmentFromCloud(String attachmentId)throws IOException;
    void deleteAttachmentInCloud(String attachmentId)throws IOException;
}
