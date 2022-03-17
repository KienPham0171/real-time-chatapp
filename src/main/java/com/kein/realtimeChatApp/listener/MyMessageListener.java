package com.kein.realtimeChatApp.listener;

import com.kein.realtimeChatApp.Model.Message;
import com.kein.realtimeChatApp.Model.Notification;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.BatchMessageListener;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.KafkaMessageListenerContainer;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MyMessageListener {
    @Autowired
    SimpMessagingTemplate sender;
    @Autowired
    ConsumerFactory<String,Message> consumerFactory;
    @KafkaListener(topics = "notification",id = "myListener")
    public void listener(Notification notification) throws InterruptedException {
        String topic = "message-container-"+notification.getTargetId();
        ContainerProperties containerProps = new ContainerProperties(topic);

        containerProps.setMessageListener(new MessageListener<String, Message>() {
            @Override
            public void onMessage(ConsumerRecord<String, Message> record) {
                Message message = record.value();
                System.err.println(message.toString());

                String destination = "/topic/container-" + notification.getTargetId();
                sender.convertAndSend(destination,message);
            }

        });
        KafkaMessageListenerContainer<String,Message> container =
                new KafkaMessageListenerContainer<>(consumerFactory,containerProps);
        container.start();
//        Thread.sleep(1000);
//        container.stop();
    }
}
