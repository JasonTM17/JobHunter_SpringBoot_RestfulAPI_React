package com.vn.son.jobhunter.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
@Tag(name = "Hệ thống", description = "Nhóm API kiểm tra trạng thái cơ bản của hệ thống")
public class HomeController {
    @GetMapping("/")
    public String getHelloWorld() {
        return "Hello World";
    }
}
