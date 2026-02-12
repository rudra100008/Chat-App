package com.ChatApplication.Cloudinary;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration

public class EnvConfig {

    @PostConstruct
    public void init(){
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .directory(System.getProperty("user.dir"))
                .load();

        dotenv.entries()
                .forEach(dotenvEntry ->
                        System.setProperty(dotenvEntry.getKey(),dotenvEntry.getValue()));

    }
}
