package com.ChatApplication.Exception;

public class TwoFactorAuthException  extends RuntimeException{
    public TwoFactorAuthException(String message){
        super(message);
    }
    //Throwable is a builtIn java class that represents all the error and exception.
    //exception -> all checked exception that must be handled,
    //error -> issues that occur in the system example OutOfBoundary error
    public TwoFactorAuthException(String message,Throwable cause){
        super(message,cause);
    }
}
