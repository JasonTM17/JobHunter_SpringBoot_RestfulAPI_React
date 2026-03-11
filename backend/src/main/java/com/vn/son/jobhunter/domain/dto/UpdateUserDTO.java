package com.vn.son.jobhunter.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import com.vn.son.jobhunter.domain.Company;


@Getter
@Setter
public class UpdateUserDTO {
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be greater than or equal to 0")
    @Max(value = 150, message = "Age must be less than or equal to 150")
    private Integer age;

    @Size(max = 200, message = "Address must be at most 200 characters")
    private String address;

    @NotNull(message = "Gender is required")
    private GenderEnum gender;

    private Company company;

    private Role role;
}
