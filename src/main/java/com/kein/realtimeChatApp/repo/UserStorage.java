package com.kein.realtimeChatApp.repo;

import com.kein.realtimeChatApp.Model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserStorage {
    private static final UserStorage INSTANCE = new UserStorage();

    private List<User> users;
    public static UserStorage getInstance() {
        return INSTANCE;
    }
    private UserStorage(){
        users = new ArrayList<User>();
        this.users.add(new User(1,"Kein Pham","kienpham","12345",
                "user",
                "https://res.cloudinary.com/keinpham/image/upload/v1639645473/o3iwugrjzipavwiukzci.jpg"));
        this.users.add(new User(2,"Nguyen Van An",
                "user1",
                "12345",
                "user","https://res.cloudinary.com/keinpham/image/upload/v1635670115/cwqjoxyqa4czmzdycdvd.jpg"));
        this.users.add(new User(3,"Kein Pham","user2","12345",
                "user",
                "https://res.cloudinary.com/keinpham/image/upload/v1639645473/o3iwugrjzipavwiukzci.jpg"));
    }
    public User addUser(User user){
        users.add(user);
        return user;
    }
    public List<User> getUsers(){
        return this.users;
    }
    public Optional<User> findUserById(int id){
        return users.stream().filter(user->user.getId() ==  id).findFirst();
    }
    public Optional<User> findUserByUserName(String userName){
        return users.stream().filter(user->user.getUsername().equals(userName)).findFirst();
    }
}
