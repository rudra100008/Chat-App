package com.ChatApplication.Entity;


import com.ChatApplication.Enum.UserStatus;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Document(collection = "User")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = "password")
public class User  implements UserDetails {
  @MongoId
    private String userId;
    private String username;
    private String email;
    private String about;
    private String password;
    private String profilePicture;
    private String secureUrl;
    private String publicId;
    private String phoneNumber;
    private UserStatus status;
    private LocalDateTime lastSeen;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
