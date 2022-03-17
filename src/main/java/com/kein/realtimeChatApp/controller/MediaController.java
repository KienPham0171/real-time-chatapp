package com.kein.realtimeChatApp.controller;

import com.kein.realtimeChatApp.Model.MediaRequest;
import com.kein.realtimeChatApp.Model.ResponseUser;
import com.kein.realtimeChatApp.Model.User;
import com.kein.realtimeChatApp.repo.UserStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class MediaController {
    @Autowired
    SimpMessagingTemplate sender;
    @Autowired
    UserStorage storage;
    @MessageMapping("/request")
    public void boastcast(MediaRequest message){
        System.err.println(message);
        Optional<User> info = storage.findUserById(Integer.parseInt(message.getFromId()));
        if(info.isPresent()) {
            message.setInfo(
                    new ResponseUser(info.get().getId(),
                            info.get().getName(),
                            info.get().getAvatarUrl()));
        }
        String dest = "/topic/user/" + message.getDestId();
        sender.convertAndSend(dest,message);
    }
}
