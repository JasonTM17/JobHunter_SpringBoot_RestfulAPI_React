package com.vn.son.jobhunter.domain.res.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthCapabilityResponse {
    private List<String> actionKeys;
    private boolean canAccessManagement;
    private List<RoleOption> assignableRoles;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleOption {
        private Long id;
        private String name;
    }
}
