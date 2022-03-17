package com.kein.realtimeChatApp.configuration;

import com.cloudinary.Cloudinary;
import com.kein.realtimeChatApp.repo.UserStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class ProjectConfig {

    @Bean
    public UserStorage userStorage(){
        return UserStorage.getInstance();
    }

    @Value("${cloudName}")
    private String cloudName;
    @Value("${apiKey}")
    private String apiKey;
    @Value("${apiSecret}")
    private String apiSecret;
    @Bean
    public Cloudinary cloudinaryConfig() {
        Cloudinary cloudinary = null;
        Map config = new HashMap();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        cloudinary = new Cloudinary(config);

        return cloudinary;
    }
}
