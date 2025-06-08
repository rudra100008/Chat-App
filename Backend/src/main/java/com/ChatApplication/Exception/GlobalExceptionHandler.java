package com.ChatApplication.Exception;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.support.ErrorMessage;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private ResponseEntity<?> createErrorResponse(HttpStatus status, String message, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timeStamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", status.getReasonPhrase());
        response.put("message", message);
        response.put("path", request.getDescription(false));
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e, WebRequest request) {
        return createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + e.getMessage(),
                request);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<?> handleAlreadyExistsException(AlreadyExistsException e, WebRequest request) {
        return createErrorResponse(
                HttpStatus.CONFLICT,
                e.getMessage(),
                request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e, WebRequest request) {
        return createErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFoundException(ResourceNotFoundException e, WebRequest request) {
        return createErrorResponse(
                HttpStatus.NOT_FOUND,
                e.getMessage(),
                request
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalStateException(IllegalStateException e, WebRequest request) {
        return createErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException e,WebRequest request){
        return createErrorResponse(HttpStatus.BAD_REQUEST,e.getMessage(),request);
    }
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolationException(ConstraintViolationException e,WebRequest request){
        return createErrorResponse(HttpStatus.BAD_REQUEST,"Validation Error:"+e.getMessage(),request);
    }
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentialsException(BadCredentialsException e,WebRequest request){
        return createErrorResponse(HttpStatus.UNAUTHORIZED,e.getMessage(),request);
    }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDeniedException(AccessDeniedException e,WebRequest request){
        return createErrorResponse(HttpStatus.FORBIDDEN,e.getMessage(),request);
    }

    @ExceptionHandler(TwoFactorAuthException.class)
    public ResponseEntity<?> handleAccessDeniedException(TwoFactorAuthException e,WebRequest request){
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage(),request);
    }
    @ExceptionHandler(ImageProcessingException.class)
    public  ResponseEntity<?> handleImageProcessingException(ImageProcessingException e,WebRequest request){
        return  createErrorResponse((HttpStatus.BAD_REQUEST),e.getMessage(),request);
    }

    @ExceptionHandler(ImageInvalidException.class)
    public  ResponseEntity<?> handleImageInvalidException(ImageInvalidException e,WebRequest request){
        return  createErrorResponse((HttpStatus.BAD_REQUEST),e.getMessage(),request);
    }

    @MessageExceptionHandler(MethodArgumentNotValidException.class)
    public void handleValidationException(MethodArgumentNotValidException e, Principal principal){
        List<String> errors = e.getBindingResult().getFieldErrors()
                .stream()
                .map(err-> err.getField()+": "+err.getDefaultMessage())
                .toList();
        this.messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/errors",
               new WebSocketErrorMessage("Validation failed",errors));

    }
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<?> handleExpiredJwtException(ExpiredJwtException e,WebRequest request){
        return createErrorResponse(HttpStatus.UNAUTHORIZED,e.getMessage(),request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleAccessDeniedException(ForbiddenException e,WebRequest request){
        return createErrorResponse(HttpStatus.FORBIDDEN,e.getMessage(),request);
    }

}
