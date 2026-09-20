package com.eaglemotion.backend.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity
                .status(500)
                .body(Map.of(
                        "error", e.getClass().getName(),
                        "message", e.getMessage() == null ? "No message" : e.getMessage()
                ));
    }
}
