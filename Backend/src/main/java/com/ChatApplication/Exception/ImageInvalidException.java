package com.ChatApplication.Exception;



public class ImageInvalidException extends RuntimeException{
    public ImageInvalidException(String message){
        super(message);
    }
    public ImageInvalidException(String message,Throwable cause){
        super(message, cause);
    }
}
