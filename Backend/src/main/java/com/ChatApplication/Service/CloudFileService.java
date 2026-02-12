package com.ChatApplication.Service;

import com.ChatApplication.DTO.CloudinaryFileInfo;
import com.ChatApplication.DTO.CloudinaryResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public interface CloudFileService {
    String uploadImage(String folder, MultipartFile file)throws IOException;
    CloudinaryResponse uploadImageWithDetails(MultipartFile imageFile,String folder)throws  IOException;
    String getFileUrl(String publicId);
    String deleteImage(String publicId)throws IOException;
    CloudinaryFileInfo getFileInfoByPublicId(String publicId) throws IOException,Exception;
    MediaType determineMediaType(String fileName);
}
