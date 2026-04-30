package com.vn.son.jobhunter.domain.dto.resume;

import com.vn.son.jobhunter.util.constant.ResumeStateEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeStatusUpdateDTO {
    @NotNull(message = "Status is required")
    private ResumeStateEnum status;
}
