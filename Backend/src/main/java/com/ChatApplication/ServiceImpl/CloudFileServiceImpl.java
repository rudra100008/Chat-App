package com.ChatApplication.ServiceImpl;

import com.ChatApplication.DTO.CloudinaryFileInfo;
import com.ChatApplication.DTO.CloudinaryResponse;
import com.ChatApplication.Exception.ImageInvalidException;
import com.ChatApplication.Service.CloudFileService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CloudFileServiceImpl implements CloudFileService {
    private final Cloudinary cloudinary;
    private static  final List<String> ALLOWED_EXTENSIONS = List.of("jpg","jpeg","png","gif","jfif");
    private static final Set<String> DEFAULT_IMAGES = Set.of("default.png", "defaultGroupChat.jpg");

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

    private static final Map<String, List<String>> ALLOWED_ATTACHMENT = new HashMap<>();
    static{
        ALLOWED_ATTACHMENT.put("documents", List.of("pdf", "doc", "docx", "txt", "rtf"));
        ALLOWED_ATTACHMENT.put("presentations", List.of("ppt", "pptx"));
        ALLOWED_ATTACHMENT.put("images", List.of("jpg", "jpeg", "png", "gif", "bmp", "svg"));
        ALLOWED_ATTACHMENT.put("audio", List.of("mp3", "wav", "aac", "flac"));
        ALLOWED_ATTACHMENT.put("video", List.of("mp4", "avi", "mkv", "mov", "wmv"));
    }
    @Value("${publicId.default.userImage}")
    private String userImagePublicId;
    @Value("${publicId.default.groupChat}")
    private String groupImagePublicId;

    @Override
    public String uploadImage(String folder, MultipartFile file) throws IOException {
        CloudinaryResponse response = uploadImageWithDetails(file,folder);
        return response.secureUrl();
    }

    @Override
    public CloudinaryResponse uploadImageWithDetails(MultipartFile imageFile,String folder)throws IOException {
        validateImage(imageFile);
        String publicId = generatePublicId(imageFile);

        Map<String, Object> uploadOptions = new HashMap<>();
        if(folder != null && !folder.isEmpty()) {
            uploadOptions.put("folder", folder);
        }
        uploadOptions.put("public_id",publicId);

        Map<?,?> uploadResult = cloudinary.uploader().upload(
                imageFile.getBytes(),
                uploadOptions
        );
        return new CloudinaryResponse(
                (String) uploadResult.get("public_id"),
                (String) uploadResult.get("secure_url"),
                (String) uploadResult.get("url"),
                (String) uploadResult.get("folder"),
                imageFile.getOriginalFilename()
        );
    }



    @Override
    public String getFileUrl(String publicId) {
        return cloudinary.url().generate(publicId);
    }



    @Override
    public String deleteImage(String publicId) throws IOException {
        List<String> DEFAULT_IMAGE_PUBLIC_URL = List.of(
                userImagePublicId,
                groupImagePublicId
        );
        if(DEFAULT_IMAGE_PUBLIC_URL.contains(publicId)){
            return "Failed to delete default image:" + publicId;
        }
        Map<?,?> deleteFile = cloudinary
                .uploader()
                .destroy(publicId, ObjectUtils.emptyMap());
        String result = (String) deleteFile.get("result");

        if ("ok".equals(result)){
            return "File deleted successfully: "+ publicId;
        }else{
            return "Failed to delete file: "+ publicId;
        }
    }


    @Override
    public CloudinaryFileInfo getFileInfoByPublicId(String publicId) throws IOException,Exception {

        Map<?, ?> result = cloudinary.api().resource(
                publicId,
                Map.of("resource_type", "auto")
        );

        return new CloudinaryFileInfo(
                (String) result.get("public_id"),
                (String) result.get("format"),
                ((Number) result.get("bytes")).longValue(),
                (String) result.get("resource_type"),
                (String) result.get("created_at"),
                (String) result.get("secure_url")
        );
    }


    @Override
    public MediaType determineMediaType(String fileName) {
        String lowerCase = fileName.toLowerCase();
        if(lowerCase.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lowerCase.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if(lowerCase.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    @Override
    public String uploadAttachment(String folder, MultipartFile file) throws IOException {
        CloudinaryResponse response = uploadAttachmentWithDetails(folder, file);
        return response.secureUrl();
    }

    @Override
    public CloudinaryResponse uploadAttachmentWithDetails(String folder, MultipartFile file) throws IOException {
        validateAttachment(file);
        String publicId = generatePublicId(file);

        // Determine resource_type based on file extension
        String extension = getFileExtension(file.getOriginalFilename());
        String resourceType = resolveResourceType(extension);

        Map<String, Object> uploadOptions = new HashMap<>();
        if (folder != null && !folder.isEmpty()) {
            uploadOptions.put("folder", folder);
        }
        uploadOptions.put("public_id", publicId);
        uploadOptions.put("resource_type", resourceType);

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                uploadOptions
        );

        return new CloudinaryResponse(
                (String) uploadResult.get("public_id"),
                (String) uploadResult.get("secure_url"),
                (String) uploadResult.get("url"),
                (String) uploadResult.get("folder"),
                file.getOriginalFilename()
        );
    }

    @Override
    public String deleteAttachment(String publicId) throws IOException, Exception {
        if (publicId == null || publicId.trim().isEmpty()) {
            return "Failed to delete: publicId cannot be null or empty";
        }

        // Try deleting as each resource type since attachments can be any type
        String[] resourceTypes = {"image", "video", "raw"};
        for (String resourceType : resourceTypes) {
            Map<?, ?> deleteResult = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", resourceType)
            );
            String result = (String) deleteResult.get("result");
            if ("ok".equals(result)) {
                return "Attachment deleted successfully: " + publicId;
            }
        }

        return "Failed to delete attachment: " + publicId;
    }


    // helper method
    private void validateImage(MultipartFile file){
        if( file == null ||file.isEmpty()){
            throw new ImageInvalidException("Image cannot be empty");
        }
        if(file.getSize()>MAX_IMAGE_SIZE){
            throw new ImageInvalidException("Image cannot be large cannot than 10MB");
        }
        String imageName = file.getOriginalFilename();
        if(imageName == null || imageName.trim().isEmpty()){
            throw new ImageInvalidException("Image name cannot be empty");
        }
        String extension = getFileExtension(imageName);
        if (!ALLOWED_EXTENSIONS.contains(extension)){
            throw new ImageInvalidException("Only JPG, JPEG, PNG, GIF, JFIF, and WEBP files are allowed");
        }

        String contentType = file.getContentType();
        if(contentType == null  || !contentType.startsWith("image/")){
            throw  new ImageInvalidException("File must be a image.");
        }

    }
    private void validateAttachment(MultipartFile file){
        if( file == null ||file.isEmpty()){
            throw new RuntimeException("File cannot be empty");
        }
        if(file.getSize()>MAX_FILE_SIZE){
            throw new RuntimeException("File cannot be large cannot than 25MB");
        }
        String filename = file.getOriginalFilename();
        if(filename == null || filename.trim().isEmpty()){
            throw new RuntimeException("File name cannot be empty");
        }
        String extension = getFileExtension(filename);
        if (ALLOWED_ATTACHMENT.values().stream().noneMatch(list -> list.contains(extension))){
            throw new RuntimeException(String.format("%s is not allowed", extension));
        }
    }


    private String resolveResourceType(String extension) {
        List<String> videoExtensions = List.of("mp4", "avi", "mkv", "mov", "wmv");
        List<String> audioExtensions = List.of("mp3", "wav", "aac", "flac");
        List<String> imageExtensions = List.of("jpg", "jpeg", "png", "gif", "bmp", "svg");

        if (videoExtensions.contains(extension) || audioExtensions.contains(extension)) {
            return "video"; // Cloudinary uses "video" for both video and audio
        } else if (imageExtensions.contains(extension)) {
            return "image";
        } else {
            return "raw"; // for documents: pdf, doc, ppt, txt, etc.
        }
    }
    private String getFileExtension(String fileName){
        int lastDotIndex = fileName.lastIndexOf(".");
        if(lastDotIndex == -1 || lastDotIndex == fileName.length() - 1){
            throw new ImageInvalidException("Invalid file name format");
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    private String generatePublicId(MultipartFile imageFile){
        String originalFileName = imageFile.getOriginalFilename();
        if(originalFileName == null || originalFileName.trim().isEmpty()){
            return "file_"+ System.currentTimeMillis();
        }

        // Remove extension from original filename
        String fileNameWithoutExtension = originalFileName;
        int lastDotIndex = originalFileName.lastIndexOf(".");
        if (lastDotIndex > 0) {
            fileNameWithoutExtension = originalFileName.substring(0, lastDotIndex);
        }

        return UUID.randomUUID().toString() + "_" + fileNameWithoutExtension;
    }

//    private boolean deleteImage(String publicId){
//        if (publicId == null) return false;
//
//        String lower
//    }
}
