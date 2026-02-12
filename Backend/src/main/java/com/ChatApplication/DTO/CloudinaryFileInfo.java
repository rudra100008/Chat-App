package com.ChatApplication.DTO;

public record CloudinaryFileInfo(
        String publicId,
        String format,
        long bytes,
        String resourceType,
        String createdAt,
        String secureUrl
) {
}

