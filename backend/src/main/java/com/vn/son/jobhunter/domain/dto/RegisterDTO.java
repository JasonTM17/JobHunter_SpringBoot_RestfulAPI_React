package com.vn.son.jobhunter.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import com.vn.son.jobhunter.util.constant.GenderEnum;

@Getter
@Setter
public class RegisterDTO {
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @Min(value = 0, message = "Age must be greater than or equal to 0")
    @Max(value = 150, message = "Age must be less than or equal to 150")
    private int age;

    @NotBlank(message = "Email is required")
    @NotNull(message = "Email cannot be null")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @NotNull(message = "Password cannot be null")
    @Size(min = 6, max = 200, message = "Password must be between 6 and 200 characters")
    private String password;

    @Size(max = 200, message = "Address must be at most 200 characters")
    private String address;

    @NotNull(message = "Gender cannot be null")
    private GenderEnum gender;
}
