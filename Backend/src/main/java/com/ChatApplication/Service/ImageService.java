package com.ChatApplication.Service;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.io.IOException;
@Service
public interface ImageService {
    public String uploadImage(String uploadDir, MultipartFile file)throws IOException;
    public byte[] getImage (String uploadDir, String userImage)throws IOException;
    public String deleteImage(String uploadDir,String userImage)throws IOException;
    public MediaType determineMediaType(String fileName);
}
