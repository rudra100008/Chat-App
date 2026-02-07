package com.ChatApplication.Security;

import com.ChatApplication.Exception.ResourceNotFoundException;
import com.ChatApplication.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {
    private final UserRepository userRepository;
    @Override
    public UserDetails loadUserByUsername(String phoneNumber) throws UsernameNotFoundException {
        return  this.userRepository.findByPhoneNumber(phoneNumber)
                .or(()->this.userRepository.findByUsername(phoneNumber))
                .orElseThrow(()-> new ResourceNotFoundException(phoneNumber + " not found"));

    }
}
