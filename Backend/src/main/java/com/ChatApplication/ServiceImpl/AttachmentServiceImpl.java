package com.ChatApplication.ServiceImpl;

import com.ChatApplication.Entity.Attachment;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.AttachmentRepository;
import com.ChatApplication.Service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {
    private  final AttachmentRepository attachmentRepository;
    @Value("${file.upload.dir}")
    private String uploadDir;

    private static final Map<String, List<String>> FILE_CATEGORIES = new HashMap<>();
    static{
        FILE_CATEGORIES.put("documents", List.of("pdf", "doc", "docx", "txt", "rtf"));
        FILE_CATEGORIES.put("presentations", List.of("ppt", "pptx"));
        FILE_CATEGORIES.put("images", List.of("jpg", "jpeg", "png", "gif", "bmp", "svg"));
        FILE_CATEGORIES.put("audio", List.of("mp3", "wav", "aac", "flac"));
        FILE_CATEGORIES.put("video", List.of("mp4", "avi", "mkv", "mov", "wmv"));
    }
    @Override
    public Attachment uploadAttachment(MultipartFile file){
       try{
         validateAttachment(file);

         String originalFileName = cleanFileName(file.getOriginalFilename());
         if(originalFileName == null){
             throw new IllegalArgumentException("Invalid file Name.");
         }
         String extension = getExtension(originalFileName);
         if(!isExtensionAllowed(extension)){
             throw new IllegalArgumentException("Oops! This file type isn't allowed. Please choose a supported format.");
         }

         String fileCategory = getFileCategories(extension);
         if(fileCategory == null){
             throw new IllegalArgumentException("Unsupported file type. Upload a valid format.");
         }

           String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
           Path baseUploadPath  = Path.of(uploadDir).normalize();
           Path categoryPath = baseUploadPath.resolve(fileCategory).normalize();
           Path filePath = categoryPath.resolve(uniqueFileName);
           if(!Files.exists(categoryPath)){
               Files.createDirectories(categoryPath);
           }
           Files.copy(file.getInputStream(),filePath, StandardCopyOption.REPLACE_EXISTING);
           Attachment attachment = Attachment.builder()
                   .fileName(uniqueFileName)
                   .fileType(file.getContentType())
                   .build();
           return this.attachmentRepository.save(attachment);
       }catch (FileNotFoundException e){
          throw new RuntimeException("error: "+e.getMessage());
       }catch (Exception e){
           throw new RuntimeException(e.getMessage());
       }
    }

    @Override
    public void deleteAttachment(String attachmentId) {
        if (!StringUtils.hasText(attachmentId)) {
            throw new IllegalArgumentException("Attachment ID cannot be null or empty");
        }

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(()-> new ResourceNotFoundException("Delete attachment not found."));
        String uniqueFileName = attachment.getFileName();
        String extension = getExtension(uniqueFileName);
        String category = getFileCategories(extension);
        if(category == null){
            throw new IllegalArgumentException("Unsupported file type. Upload a valid format.");
        }
        try{
            Path basePath = Path.of(uploadDir).normalize();
            Path categoryPath = basePath.resolve(category).normalize();
            Path originalPath = categoryPath.resolve(uniqueFileName);
            if(Files.exists(originalPath)){
                Files.delete(originalPath);
            }
            attachmentRepository.delete(attachment);
        }catch (IOException e){
            throw new RuntimeException("Could not delete file "+ attachment.getAttachmentId() + ". Please try again",e);
        }
    }
    @Override
    public Resource downloadAttachment(String attachmentId) {
        if(!StringUtils.hasText(attachmentId)){
            throw  new IllegalArgumentException("Attachment ID cannot be null or empty");
        }
        try{
            Attachment attachment = attachmentRepository.findById(attachmentId)
                    .orElseThrow(()-> new ResourceNotFoundException("Download attachment not found."));
            String fileName  = attachment.getFileName();
            if(!StringUtils.hasText(fileName)){
                throw new IllegalArgumentException("Invalid file Name.");
            }
            String extension = getExtension(fileName);
            if(!isExtensionAllowed(extension)){
                throw new IllegalArgumentException("Oops! This file type isn't allowed. Please choose a supported format.");
            }
            String category = getFileCategories(extension);
            if(!StringUtils.hasText(category)){
                throw new IllegalArgumentException("Unsupported file type. Upload a valid format.");
            }
            Path baseDirPath = Path.of(uploadDir).normalize();
            Path  categoryPath = baseDirPath.resolve(category).normalize();
            if(!Files.exists(categoryPath)){
                throw new FileNotFoundException("File not found: " + categoryPath);
            }
            Path filePath = categoryPath.resolve(fileName);

            Resource resource =  new  UrlResource(filePath.toUri());
            if(!resource.exists() || !resource.isReadable()){
                throw new FileNotFoundException("File is not readable: " + filePath);
            }
            return resource;

        }catch(Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }
    //helper class
    private void validateAttachment(MultipartFile file) throws Exception {
        if(file == null || file.isEmpty()){
            throw new FileNotFoundException("file is empty or null");
        }
    }

    private String cleanFileName(String fileName){
        String cleanFileName = StringUtils.cleanPath(fileName);
        if(cleanFileName.contains("..")){
            return null;
        }else{
            if(StringUtils.hasText(cleanFileName)) {
                return cleanFileName;
            }else{
                return null;
            }
        }
    }

    // to check if extension of uploaded file is allowed
    private  boolean isExtensionAllowed(String extension){
        if(extension == null) return false;
        return FILE_CATEGORIES.values().stream().anyMatch(list-> list.contains(extension));
    }

    // this method return file extension
    private String getExtension(String fileName){
        return StringUtils.getFilenameExtension(fileName.toLowerCase());
    }

    private String getFileCategories(String extension){
        for (Map.Entry<String, List<String>> entry : FILE_CATEGORIES.entrySet()){
            if(entry.getValue().contains(extension)){
                return entry.getKey();
            }
        }
        return null;
    }

}
