package com.kein.realtimeChatApp.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    private final String KEY = "secret";

    public String generateToken(UserDetails user){
        Map<String,Object> claims = new HashMap<>();
        return createToken(claims,user);
    }
    private String createToken(Map<String,Object> claims, UserDetails user){
        return Jwts.builder().setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis()+ 1000*60*30))
                .signWith(SignatureAlgorithm.HS256,KEY).compact();

    }
    public boolean validateToken(String token,UserDetails user){
        String userName = getUserName(token);
        return (userName.equals(user.getUsername()) && !isTokenExpired(token));
    }
    public Boolean isTokenExpired(String token){
        return getExpiration(token).before(new Date());
    }
    public String getUserName(String token){
        return getClaim(getAllClaims(token), Claims::getSubject);
    }
    public Date getExpiration(String token){
        return getClaim(getAllClaims(token),Claims::getExpiration);
    }
    public Claims getAllClaims(String token){
        return Jwts.parser().setSigningKey(KEY).parseClaimsJws(token).getBody();
    }
    public <T> T getClaim(Claims claims, Function<Claims,T> resolver){
        return  resolver.apply(claims);
    }
}
