package com.ChatApplication.Repository;

import com.ChatApplication.Entity.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AttachmentRepository extends MongoRepository<Attachment,String> {
}
