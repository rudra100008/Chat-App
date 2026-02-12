package com.ChatApplication.Cloudinary;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Value("${CLOUDINARY_URL}")
    private String cloudinaryUrl;


    @Bean
    public Cloudinary cloudinary(){
        if(cloudinaryUrl != null && !cloudinaryUrl.isEmpty()){
            return new Cloudinary(cloudinaryUrl);
        }
        throw  new IllegalStateException(
                "Cloudinary configuration not found. Please set Cloudinary url as environment variable."
        );

    }
}
