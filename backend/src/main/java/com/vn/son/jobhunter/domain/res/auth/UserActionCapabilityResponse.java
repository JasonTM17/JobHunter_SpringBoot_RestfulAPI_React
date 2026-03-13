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
public class UserActionCapabilityResponse {
    private Long targetUserId;
    private boolean canView;
    private boolean canUpdate;
    private boolean canDelete;
    private boolean canAssignRole;
    private List<AuthCapabilityResponse.RoleOption> assignableRoles;
}
