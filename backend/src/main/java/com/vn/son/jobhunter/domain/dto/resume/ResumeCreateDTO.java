package com.vn.son.jobhunter.domain.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeCreateDTO {
    @NotNull(message = "Job ID is required")
    private Long jobId;

    @NotBlank(message = "Url is required")
    @Size(max = 500, message = "Url must be at most 500 characters")
    private String url;
}
