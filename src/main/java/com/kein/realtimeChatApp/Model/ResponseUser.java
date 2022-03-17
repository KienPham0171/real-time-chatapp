package com.kein.realtimeChatApp.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseUser {
    private long id;
    private String userName;
    private String avatarUrl;
}
