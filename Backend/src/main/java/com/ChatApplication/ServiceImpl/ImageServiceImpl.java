package com.ChatApplication.ServiceImpl;

import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Exception.ImageProcessingException;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Service.ImageService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {
    private static  final List<String> ALLOWED_ETENSIONS = List.of("jpg","jpeg","png","gif","jfif");
    private static final  int MAX_SIZE = 20* 1024 *1024; // 20971520 bytes into 20MB
    private static final Set<String> DEFAULT_IMAGES = Set.of("default.png", "defaultGroupChat.jpg");

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



    @Override
    public byte[] getImage(String uploadDir, String imageName) throws IOException {
        Path path = Path.of(uploadDir, imageName);
        if (Files.exists(path)) {
            return Files.readAllBytes(path);
        } else {
            throw new ResourceNotFoundException("Image not found: " + imageName);
        }
    }
    @Override
    public String deleteImage(String uploadDir, String imageName) throws IOException {
        if(DEFAULT_IMAGES.contains(imageName)){
            return "Default image cannot be deleted";
        }
        Path path = Path.of(uploadDir,imageName);
        if (Files.exists(path)){
            Files.delete(path);
            return "Success";
        }else{
            return "Error:Image not found: "+imageName;
        }

    }

    @Override
    public MediaType determineMediaType(String fileName) {
        String lowerCase = fileName.toLowerCase();
        if(lowerCase.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lowerCase.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if(lowerCase.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    //helper method
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
        String extension = getFileExtension(imageName);
        if (!ALLOWED_ETENSIONS.contains(extension)){
            throw new ImageInvalidException("Only JPG, JPEG, PNG, GIF, JFIF, and WEBP files are allowed");
        }

        String contentType = file.getContentType();
        if(contentType == null  || !contentType.startsWith("image/")){
            throw  new ImageInvalidException("File must be a image.");
        }

    }

    private String getFileExtension(String fileName){
        int lastDotIndex = fileName.lastIndexOf(".");
        if(lastDotIndex == -1 || lastDotIndex == fileName.length() - 1){
            throw new ImageInvalidException("Invalid file name format");
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }


}
