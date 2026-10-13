package com.eaglemotion.backend.config;

import com.eaglemotion.backend.auth.JwtService;
import com.eaglemotion.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService) {
        return new JwtAuthenticationFilter(jwtService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Allow CORS OPTIONS preflight requests
                    .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
                    
                    // Public endpoints (matching both with and without /api prefix)
                    .requestMatchers(
                            AntPathRequestMatcher.antMatcher("/health"),
                            AntPathRequestMatcher.antMatcher("/health/**"),
                            AntPathRequestMatcher.antMatcher("/api/health"),
                            AntPathRequestMatcher.antMatcher("/api/health/**"),
                            AntPathRequestMatcher.antMatcher("/auth/**"),
                            AntPathRequestMatcher.antMatcher("/api/auth/**"),
                            AntPathRequestMatcher.antMatcher("/videos"),
                            AntPathRequestMatcher.antMatcher("/videos/**"),
                            AntPathRequestMatcher.antMatcher("/api/videos"),
                            AntPathRequestMatcher.antMatcher("/api/videos/**")
                    ).permitAll()
                    
                    .anyRequest().authenticated()
            )
            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}