package com.ChatApplication.Exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketErrorMessage {
    private String message;
    private List<String> errors;

}
