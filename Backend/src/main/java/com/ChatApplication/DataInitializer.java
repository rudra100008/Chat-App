package com.ChatApplication;

import com.ChatApplication.Config.CustomMultipartFile;
import com.ChatApplication.Service.CloudFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    @Value("${image.upload.dir}")
    private String baseDir;
    @Value("${publicId.default.userImage}")
    private String userImagePublicId;
    @Value("${publicId.default.groupChat}")
    private String groupImagePublicId;
    private final CloudFileService cloudFileService;

    @Override
    public void run(String... args) throws Exception {
//        log.info("Checking if default images need to be uploaded to Cloudinary.");
//        uploadDefaultImagesForUserAndGroupChat();
    }

    private void uploadDefaultImagesForUserAndGroupChat() throws IOException {
        Path userImagePath = Path.of(baseDir, "userImage", "default.png");
        Path groupImagePath = Path.of(baseDir, "groupChat", "defaultGroupChat.jpg");

        // Check and upload user default image
        String userPublicId = "userImage/default";
        if (!imageExistsInCloudinary(userPublicId)) {
            if (Files.exists(userImagePath)) {
                uploadIfExists(userImagePath, "userImage");
                log.info("Default user image uploaded to Cloudinary");
            }
        } else {
            log.info("Default user image already exists in Cloudinary");
        }

        // Check and upload group default image
        String groupPublicId = "groupChat/defaultGroupChat";
        if (!imageExistsInCloudinary(groupPublicId)) {
            if (Files.exists(groupImagePath)) {
                uploadIfExists(groupImagePath, "groupChat");
                log.info("Default group image uploaded to Cloudinary");
            }
        } else {
            log.info("Default group image already exists in Cloudinary");
        }
    }

    private boolean imageExistsInCloudinary(String publicId) {
        try {
            cloudFileService.getFileInfoByPublicId(publicId);
            return true;
        } catch (Exception e) {
            // Image doesn't exist or error occurred
            return false;
        }
    }

    private void uploadIfExists(Path path, String folder) throws IOException {
        String fileName = path.getFileName().toString();
        byte[] content = Files.readAllBytes(path);
        String contentType = Files.probeContentType(path);

        if (contentType == null) {
            contentType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        }

        MultipartFile multipartFile = new CustomMultipartFile(
                "file",
                fileName,
                contentType,
                content
        );

        cloudFileService.uploadImage(folder, multipartFile);
        log.info("File {} uploaded to folder {}", fileName, folder);
    }
}