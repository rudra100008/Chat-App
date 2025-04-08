package com.ChatApplication.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@Service
public interface ImageService {
    public String uploadImage(String uploadDir, MultipartFile file)throws IOException;
    public byte[] getImage (String uploadDir, String username)throws IOException;
    public String deleteImage(String uploadDir,String username)throws IOException;
}
