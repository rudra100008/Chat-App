package com.ChatApplication.ServiceImpl;

import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Service.ImageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {
    @Override
    public String uploadImage(String uploadDir, MultipartFile file) throws IOException {
        String uniqueName = UUID.randomUUID().toString()+"_"+file.getOriginalFilename();
        Path imagePath = Path.of(uploadDir);
        Path completePath = imagePath.resolve(uniqueName);
        if(!Files.exists(imagePath)){
            Files.createDirectories(imagePath);
        }
        Files.copy(file.getInputStream(),completePath, StandardCopyOption.REPLACE_EXISTING);
        return uniqueName;
    }

    @Override
    public byte[] getImage(String uploadDir, String userImage) throws IOException {
        Path path =  Path.of(uploadDir,userImage);
        if (Files.exists(path)){
            return Files.readAllBytes(path);
        }else {
            throw new ResourceNotFoundException("Image not found: " + userImage);
        }
    }

    @Override
    public String deleteImage(String uploadDir, String username) throws IOException {
        Path path = Path.of(uploadDir,username);
        if (Files.exists(path)){
            Files.delete(path);
            return "Success";
        }else{
            return "error";
        }

    }
}
