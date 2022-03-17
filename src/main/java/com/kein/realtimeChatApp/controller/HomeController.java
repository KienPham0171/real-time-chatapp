package com.kein.realtimeChatApp.controller;

import com.kein.realtimeChatApp.Model.*;
import com.kein.realtimeChatApp.repo.UserStorage;
import com.kein.realtimeChatApp.service.CloundinaryFileService;
import com.kein.realtimeChatApp.util.JwtUtil;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.tomcat.util.http.parser.Authorization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaFailureCallback;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.Optional;


@RestController
@CrossOrigin("http://localhost:3000")
public class HomeController {
    @Autowired
    private KafkaTemplate<String,Message> template;
    @Autowired
    private KafkaTemplate<String, Notification> notifyTemplate;
    @Autowired
    private KafkaAdmin admin;
    @Autowired
    private ConsumerFactory<String,Message> consumerFactory;
    @Autowired
    private UserStorage userStorage;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private CloundinaryFileService fileService;


    @PostMapping(path ="/message")
    public ResponseEntity<?> test(@RequestBody Message message,Authentication auth) throws InterruptedException, IOException {
        User validUser = (User) auth.getPrincipal();
        if(validUser.getId() == message.getSendId()){

        message.setTimeStamp(new Date());
        Optional<User> sendUser = userStorage.findUserById(message.getSendId());
        Optional<User> targetUser = userStorage.findUserById(message.getTargetId());
        ResponseUser sUser = new ResponseUser();
        ResponseUser tUser = new ResponseUser();
        if(sendUser.isPresent()&& targetUser.isPresent()){
            sUser.setId(sendUser.get().getId());
            sUser.setUserName(sendUser.get().getName());
            sUser.setAvatarUrl(sendUser.get().getAvatarUrl());
            tUser.setId(targetUser.get().getId());
            tUser.setUserName(targetUser.get().getName());
            tUser.setAvatarUrl(targetUser.get().getAvatarUrl());
        }
        message.setSendUser(sUser);
        message.setTargetUser(tUser);

        AdminClient client  = AdminClient.create(admin.getConfigurationProperties());
        String topic = "message-container-" + message.getTargetId();
        NewTopic t = new NewTopic(topic,1, (short) 1);
        client.createTopics(Arrays.asList(t));

        ProducerRecord<String,Message> record = new ProducerRecord<>(topic,message);
        ProducerRecord<String,Notification> notificationRecord = new ProducerRecord<>("notification",new Notification(message.getTargetId()));

        notifyTemplate.send(notificationRecord).addCallback(result -> {
            System.out.println("do something when success");
        }, (KafkaFailureCallback<Integer, String>) ex -> {
            ProducerRecord<Integer, String> failed = ex.getFailedProducerRecord();
            System.out.println("do something when failure");
        });
        ListenableFuture<SendResult<String,Message>> future =  template.send(record);
        future.addCallback(new ListenableFutureCallback<SendResult<String, Message>>() {
            @Override
            public void onSuccess(SendResult<String, Message> result) {
                System.out.println("success");
            }

            @Override
            public void onFailure(Throwable ex) {
                System.out.println("failure");
            }
        });


        return ResponseEntity.ok("Successfully");
        }else{
            return ResponseEntity.ok("incorrectSendId");
        }
    }
    @PostMapping(path = "/multipart-message",consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> processMultipartMessage(Message message,
                                                     @RequestParam("multipartData") MultipartFile multipartData,
                                                     Authentication auth) throws IOException {
        User validUser = (User) auth.getPrincipal();
        if(validUser.getId() == message.getSendId()){

            if(multipartData!=null){
                String url = fileService.saveMultipartFile(multipartData);
                message.setMultipartUrl(url);
            }
            message.setTimeStamp(new Date());
            Optional<User> sendUser = userStorage.findUserById(message.getSendId());
            Optional<User> targetUser = userStorage.findUserById(message.getTargetId());
            ResponseUser sUser = new ResponseUser();
            ResponseUser tUser = new ResponseUser();
            if(sendUser.isPresent()&& targetUser.isPresent()){
                sUser.setId(sendUser.get().getId());
                sUser.setUserName(sendUser.get().getName());
                sUser.setAvatarUrl(sendUser.get().getAvatarUrl());
                tUser.setId(targetUser.get().getId());
                tUser.setUserName(targetUser.get().getName());
                tUser.setAvatarUrl(targetUser.get().getAvatarUrl());
            }
            message.setSendUser(sUser);
            message.setTargetUser(tUser);

            AdminClient client  = AdminClient.create(admin.getConfigurationProperties());
            String topic = "message-container-" + message.getTargetId();
            NewTopic t = new NewTopic(topic,1, (short) 1);
            client.createTopics(Arrays.asList(t));

            ProducerRecord<String,Message> record = new ProducerRecord<>(topic,message);
            ProducerRecord<String,Notification> notificationRecord = new ProducerRecord<>("notification",new Notification(message.getTargetId()));

            notifyTemplate.send(notificationRecord).addCallback(result -> {
                System.out.println("do something when success");
            }, (KafkaFailureCallback<Integer, String>) ex -> {
                ProducerRecord<Integer, String> failed = ex.getFailedProducerRecord();
                System.out.println("do something when failure");
            });
            ListenableFuture<SendResult<String,Message>> future =  template.send(record);
            future.addCallback(new ListenableFutureCallback<SendResult<String, Message>>() {
                @Override
                public void onSuccess(SendResult<String, Message> result) {
                    System.out.println("success");
                }

                @Override
                public void onFailure(Throwable ex) {
                    System.out.println("failure");
                }
            });


            return ResponseEntity.ok("Successfully");
        }else{
            return ResponseEntity.ok("incorrectSendId");
        }
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody AuthRequest user)throws Exception {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
        }catch(BadCredentialsException ex){
            throw new Exception("Incorrect username",ex);
        }
        UserDetails validUser = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(validUser);
        Optional<User> u = userStorage.findUserByUserName(user.getUsername());
        ResponseUser responseUser = new ResponseUser();
        if(u.isPresent()){
            responseUser.setId(u.get().getId());
            responseUser.setUserName(u.get().getName());
            responseUser.setAvatarUrl(u.get().getAvatarUrl());
        }
        return ResponseEntity.ok(new AuthResponse(token,responseUser));

    }
    @GetMapping("/check-token")
    public ResponseEntity<?> checkToken(Authentication a){
        User u= (User) a.getPrincipal();
        return ResponseEntity.ok(new ResponseUser(u.getId(),u.getName(),u.getAvatarUrl()));
    }
    @GetMapping("/out")
    public void out(){
        System.err.println("i'm out");
    }


}
