package com.kein.realtimeChatApp.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class MediaRequest {
    private String type;
    private String fromId;
    private String destId;
    private Object data;
    private ResponseUser info;
}
