package com.vn.son.jobhunter.domain.dto.candidate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CandidateCvRequest {
    @NotBlank(message = "CV URL is required")
    @Size(max = 500, message = "CV URL must be at most 500 characters")
    private String fileUrl;

    @Size(max = 255, message = "CV file name must be at most 255 characters")
    private String fileName;

    private Boolean defaultCv;
}
