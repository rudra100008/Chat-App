package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.CloudinaryResponse;
import com.ChatApplication.Entity.Attachment;
import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.AttachmentRepository;
import com.ChatApplication.Service.AttachmentService;
import com.ChatApplication.Service.CloudFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
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

    private final CloudFileService cloudFileService;

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
    public Attachment uploadAttachmentToCloud(MultipartFile file) throws IOException, Exception {
        try {
            validateAttachment(file);

            String originalFileName = cleanFileName(file.getOriginalFilename());
            if (originalFileName == null) {
                throw new IllegalArgumentException("Invalid file name.");
            }
            String extension = getExtension(originalFileName);
            if (!isExtensionAllowed(extension)) {
                throw new IllegalArgumentException("Oops! This file type isn't allowed. Please choose a supported format.");
            }
            String fileCategory = getFileCategories(extension);
            if (fileCategory == null) {
                throw new IllegalArgumentException("Unsupported file type. Upload a valid format.");
            }

            // REMOVED: uniqueFileName was generated but never used — Cloudinary handles naming internally
            CloudinaryResponse cloudinaryResponse = cloudFileService.uploadAttachmentWithDetails(fileCategory, file);

            Attachment attachment = Attachment.builder()
                    .fileName(cloudinaryResponse.originalFileName()) // use the name returned from Cloudinary
                    .publicId(cloudinaryResponse.publicId())
                    .secureUrl(cloudinaryResponse.secureUrl())
                    .fileType(file.getContentType())
                    .build();

            return attachmentRepository.save(attachment);

        } catch (IOException e) {
            throw new IOException(String.format("Failed to upload file (%s): %s", file.getContentType(), e.getMessage()));
        } catch (Exception e) {
            throw new Exception("An unexpected error occurred: " + e.getMessage());
        }
    }

    @Override
    public Resource downloadAttachmentFromCloud(String attachmentId) throws IOException {
        if (!StringUtils.hasText(attachmentId)) {
            throw new IllegalArgumentException("Attachment ID cannot be null or empty");
        }

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));

        String secureUrl = attachment.getSecureUrl();
        if (!StringUtils.hasText(secureUrl)) {
            throw new IllegalStateException("No cloud URL found for attachment: " + attachmentId);
        }

        try {
            URL url = new URL(secureUrl);
            URLConnection connection = url.openConnection();
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(10000);

            InputStream inputStream = connection.getInputStream();
            byte[] fileBytes = inputStream.readAllBytes();
            inputStream.close();

            return new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return attachment.getFileName();
                }
            };

        } catch (IOException e) {
            throw new IOException("Failed to download attachment from cloud: " + e.getMessage());
        }
    }

    @Override
    public void deleteAttachmentInCloud(String attachmentId) throws IOException {
        if (!StringUtils.hasText(attachmentId)) {
            throw new IllegalArgumentException("Attachment ID cannot be null or empty");
        }

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));

        String publicId = attachment.getPublicId();
        if (!StringUtils.hasText(publicId)) {
            throw new IllegalStateException("No public ID found for attachment: " + attachmentId);
        }

        try {
            String result = cloudFileService.deleteAttachment(publicId);
            if (result.startsWith("Failed")) {
                throw new IOException("Cloudinary deletion failed: " + result);
            }
            attachmentRepository.delete(attachment);

        } catch (IOException e) {
            throw new IOException("Failed to delete attachment from cloud: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while deleting attachment: " + e.getMessage());
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
