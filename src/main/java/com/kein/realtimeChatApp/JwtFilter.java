package com.kein.realtimeChatApp;

import com.kein.realtimeChatApp.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
public class JwtFilter extends OncePerRequestFilter {
    private UserDetailsService service;
    private JwtUtil jwtUtil;
    @Autowired
    public JwtFilter(UserDetailsService service, JwtUtil jwtUtil) {
        this.service = service;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        String userName = null;
        String token = null;


        if(authorizationHeader!= null && authorizationHeader.startsWith("Bearer ")){
            token = authorizationHeader.substring(7);
            userName = jwtUtil.getUserName(token);
        }
        if(userName!=null && SecurityContextHolder.getContext().getAuthentication() == null){
            UserDetails user = service.loadUserByUsername(userName);
            if(!jwtUtil.validateToken(token,user))response.setStatus(700);
            if(jwtUtil.validateToken(token,user)){
                UsernamePasswordAuthenticationToken validUser =
                        new UsernamePasswordAuthenticationToken(user,null,user.getAuthorities());
                validUser.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(validUser);
            }
        }
        filterChain.doFilter(request,response);
    }
}
