package com.ChatApplication.Service;

import com.ChatApplication.Entity.Attachment;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public interface AttachmentService {
    Attachment uploadAttachment( MultipartFile file);
    Resource downloadAttachment(String attachmentId);
    void deleteAttachment(Attachment attachment);
}
