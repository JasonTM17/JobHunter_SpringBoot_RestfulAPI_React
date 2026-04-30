package com.vn.son.jobhunter.domain.dto.resume;

import com.vn.son.jobhunter.util.constant.ResumeStateEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeStatusUpdateDTO {
    @NotNull(message = "Status is required")
    private ResumeStateEnum status;

    @Size(max = 500, message = "Audit note must be at most 500 characters")
    private String note;
}
