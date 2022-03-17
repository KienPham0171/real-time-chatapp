package com.kein.realtimeChatApp.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message implements Serializable {
    private String type;
    private int sendId;
    private int targetId;
    private ResponseUser sendUser;
    private String message;
    private ResponseUser targetUser;
    private Date timeStamp;
    private String multipartUrl;

}
