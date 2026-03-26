package com.ChatApplication.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfigurationMethod {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedMethods(List.of("GET","POST","PUT","OPTIONS","DELETE","PATCH"));
        cors.setAllowedOriginPatterns(List.of("https://chat-app-pied-pi-36.vercel.app","http://localhost:3000"));
        cors.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Upgrade",           // ← required for WebSocket
                "Connection",        // ← required for WebSocket
                "Sec-WebSocket-Key", // ← required for WebSocket
                "Sec-WebSocket-Version", // ← required for WebSocket
                "Sec-WebSocket-Extensions"
        ));
        cors.setMaxAge(3600L);
        cors.setExposedHeaders(List.of("Set-Cookie","Authorization","X-XSRF-TOKEN"));
        cors.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",cors);
        return source;
    }
}
