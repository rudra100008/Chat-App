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

    private String getFileExtension(String fileName){
        int lastDotIndex = fileName.lastIndexOf(".");
        if(lastDotIndex == -1 || lastDotIndex == fileName.length() - 1){
            throw new ImageInvalidException("Invalid file name format");
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    private String generatePublicId(MultipartFile imageFile){
        String originalFileName = imageFile.getOriginalFilename();
        if(originalFileName == null){
            return "file_"+ System.currentTimeMillis();
        }
        return UUID.randomUUID().toString()+"_" + originalFileName;
    }

//    private boolean deleteImage(String publicId){
//        if (publicId == null) return false;
//
//        String lower
//    }
}
