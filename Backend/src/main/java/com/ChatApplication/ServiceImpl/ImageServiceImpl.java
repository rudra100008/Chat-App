package com.ChatApplication.ServiceImpl;

import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ImageProcessingException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Service.ImageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {
    private static  final List<String> extensions = List.of("jpg","jpeg","png","gif","jfif");
    private static final  int MAX_SIZE = 20* 1024 *1024; // 20971520 bytes into 20MB

    @Override
    public String uploadImage(String uploadDir, MultipartFile file) throws IOException {
        validateImage(file);
        String uniqueName = UUID.randomUUID().toString()+"_"+file.getOriginalFilename();
        Path imagePath = Path.of(uploadDir);
        Path completePath = imagePath.resolve(uniqueName);
        try {
            if (!Files.exists(imagePath)) {
                Files.createDirectories(imagePath);
            }
            Files.copy(file.getInputStream(), completePath, StandardCopyOption.REPLACE_EXISTING);
            return uniqueName;
        }catch(IOException e){
            throw new ImageProcessingException("Failed to upload image:\n ",e);
        }
    }

    private void validateImage(MultipartFile file){
        if( file == null ||file.isEmpty()){
            throw new ImageInvalidException("Image cannot be empty");
        }
        if(file.getSize()>MAX_SIZE){
            throw new ImageInvalidException("Image cannot be large cannot than 20MB");
        }
        String imageName = file.getOriginalFilename();
        if(imageName == null || imageName.trim().isEmpty()){
            throw new ImageInvalidException("Image name cannot be empty");
        }
        String extension = imageName.substring(imageName.lastIndexOf(".")+1).toLowerCase();
        if (!extensions.contains(extension)){
            throw new ImageInvalidException("Only JPG, JPEG, PNG, and GIF files are allowed");
        }

    }

    @Override
    public byte[] getImage(String uploadDir, String userImage) throws IOException {
        Path path = Path.of(uploadDir, userImage);
        if (Files.exists(path)) {
            return Files.readAllBytes(path);
        } else {
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
