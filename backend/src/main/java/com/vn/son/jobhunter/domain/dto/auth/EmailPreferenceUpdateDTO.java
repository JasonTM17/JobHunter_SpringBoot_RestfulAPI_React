package com.vn.son.jobhunter.domain.dto.auth;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailPreferenceUpdateDTO {
    @NotNull(message = "weeklyJobRecommendationEnabled is required")
    private Boolean weeklyJobRecommendationEnabled;
}
