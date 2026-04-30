package com.vn.son.jobhunter.domain.res.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class ForgotPasswordResponse {
    private String message;
    private String devResetToken;
    private Instant expiresAt;
}
