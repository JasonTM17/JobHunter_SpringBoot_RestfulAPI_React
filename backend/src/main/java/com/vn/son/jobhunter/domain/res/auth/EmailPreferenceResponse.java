package com.vn.son.jobhunter.domain.res.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailPreferenceResponse {
    private boolean weeklyJobRecommendationEnabled;
}
