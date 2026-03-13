package com.vn.son.jobhunter.domain.dto.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestTemplateEmailRequest {
    @NotBlank(message = "Email người nhận không được để trống")
    @Email(message = "Email người nhận không hợp lệ")
    private String recipient;

    @Size(max = 120, message = "Tên người nhận không vượt quá 120 ký tự")
    private String recipientName;

    @NotBlank(message = "Tiêu đề email không được để trống")
    @Size(max = 200, message = "Tiêu đề email không vượt quá 200 ký tự")
    private String subject;

    @Size(max = 180, message = "Tiêu đề nội dung không vượt quá 180 ký tự")
    private String title;

    @NotBlank(message = "Nội dung email không được để trống")
    @Size(max = 5000, message = "Nội dung email không vượt quá 5000 ký tự")
    private String message;

    @Size(max = 80, message = "Nhãn nút hành động không vượt quá 80 ký tự")
    private String actionText;

    @Pattern(
            regexp = "^$|^https?://.+$",
            message = "Liên kết hành động phải bắt đầu bằng http:// hoặc https://"
    )
    @Size(max = 1000, message = "Liên kết hành động không vượt quá 1000 ký tự")
    private String actionUrl;
}
