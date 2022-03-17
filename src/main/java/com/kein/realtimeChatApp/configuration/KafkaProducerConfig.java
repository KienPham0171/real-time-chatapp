package com.kein.realtimeChatApp.configuration;

import com.fasterxml.jackson.databind.JsonSerializable;
import com.kein.realtimeChatApp.Model.Message;
import com.kein.realtimeChatApp.Model.Notification;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Bean
    public KafkaAdmin admin(){
        Map<String,Object> configs = new HashMap<>();
        configs.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG,"localhost:9092");
        return new KafkaAdmin(configs);
    }
    @Bean
    public ProducerFactory<String,Message> producerFactory(){
        return new DefaultKafkaProducerFactory<>(producerConfigs());
    }
    @Bean
    public Map<String,Object> producerConfigs(){
        Map<String,Object> configs = new HashMap<>();
        configs.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"localhost:9092");
        configs.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configs.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return configs;
    }
    @Bean
    public KafkaTemplate<String, Message> kafkaTemplate(){
        return new KafkaTemplate<String,Message>(producerFactory());
    }
    @Bean
    public KafkaTemplate<String, Notification> notifyTemplate(){
        return new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerConfigs()));
    }


}
