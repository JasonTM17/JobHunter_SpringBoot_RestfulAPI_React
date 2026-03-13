package com.vn.son.jobhunter.domain.res.auth;

import lombok.*;

@Getter
@Setter
public class LoginResponse {
    private UserLogin user;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserLogin{
        private Long id;
        private String email;
        private String name;
        private RoleLogin role;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleLogin {
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGetAccout {
        private UserLogin user;
    }
}
