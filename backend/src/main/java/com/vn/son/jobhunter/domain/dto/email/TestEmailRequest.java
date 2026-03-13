package com.vn.son.jobhunter.domain.dto.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestEmailRequest {
    @NotBlank(message = "Email người nhận không được để trống")
    @Email(message = "Email người nhận không hợp lệ")
    private String recipient;

    @NotBlank(message = "Tiêu đề email không được để trống")
    @Size(max = 200, message = "Tiêu đề email không vượt quá 200 ký tự")
    private String subject;

    @NotBlank(message = "Nội dung email không được để trống")
    @Size(max = 5000, message = "Nội dung email không vượt quá 5000 ký tự")
    private String body;

    private boolean html;
}
