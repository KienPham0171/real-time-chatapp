package com.kein.realtimeChatApp.service;

import com.kein.realtimeChatApp.Model.User;
import com.kein.realtimeChatApp.repo.UserStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService implements UserDetailsService {
    @Autowired
    UserStorage storage;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = storage.findUserByUserName(username);
        if(user.isPresent()){
            return user.get();
        }else{
            throw new UsernameNotFoundException("User not found");
        }
    }
}
