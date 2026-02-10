package com.ChatApplication.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserUpdateDTO (
    @Size(min = 3,max=20,message = "Username must be between  {min} and {max} character")
    String username,
    @Email(message = "Email should be valid")
    String email,
    @Size(max = 500, message = "About section cannot exceed {max} characters")
    String about
    ){}
