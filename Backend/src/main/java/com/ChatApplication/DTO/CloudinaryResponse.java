package com.ChatApplication.DTO;

public record CloudinaryResponse(
        String publicId,
        String secureUrl,
        String url,
        String folder,
        String originalFileName
) {
}
