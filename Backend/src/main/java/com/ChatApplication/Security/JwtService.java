package com.ChatApplication.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${security.jwt.security-key}")
    private String securityKey;

    @Value("${security.jwt.expiration-date}")
    private long jwtExpiration;

    public String extractUsername(String token){
        return extractClaim(token,Claims::getSubject);
    }
    public <T> T extractClaim(String token, Function<Claims,T> claimsResolver){
        final Claims claims = extractAllClaim(token);
        return claimsResolver.apply(claims);
    }
    private Key getSignInKey(){
        byte[] key = Base64.getDecoder().decode(securityKey);
        return Keys.hmacShaKeyFor(key);
    }
    private Claims extractAllClaim(String token){
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
