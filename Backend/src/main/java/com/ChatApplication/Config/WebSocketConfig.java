package com.ChatApplication.Config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final  WebSocketAuthHandshakeInterceptor handshakeInterceptor;


    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/chatroom","/user","/private","/topic")
                .setHeartbeatValue(new long[]{4000,4000})
                .setTaskScheduler(taskScheduler());
        registry.setApplicationDestinationPrefixes("/app"); //Routes messages from clients to server-side message-handling methods.
        registry.setUserDestinationPrefix("/user"); //Routes messages to specific users for private messaging or notifications.

    }


    // URL path that the frontend will use to connect and manages message over SockJs
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
         registry.addEndpoint("/server")
                 .addInterceptors(handshakeInterceptor)
                 .setAllowedOriginPatterns("*")
                 .withSockJS()
                 .setWebSocketEnabled(true)
                 .setSuppressCors(false)
                 .setSessionCookieNeeded(true);
    }


    @Bean
    public TaskScheduler taskScheduler(){
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();

        return scheduler;
    }
}
