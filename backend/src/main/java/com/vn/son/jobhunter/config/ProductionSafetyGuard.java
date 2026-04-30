package com.vn.son.jobhunter.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Base64;

@Component
public class ProductionSafetyGuard {
    private static final String LOCAL_DEV_JWT_SECRET =
            "g/AYKfaK6dDKXZFgopotLApRTC79KZo9uIWfWCXH/bKPDt3TgG4jEX5Dm+hboY2TJmEuyVPXbSrNpvgD/SGu4A==";

    private final Environment environment;

    @Value("${jobhunter.prod-guard.enabled:true}")
    private boolean enabled;

    @Value("${son.jwt.base64-secret:}")
    private String jwtSecret;

    @Value("${son.jwt.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${jobhunter.auth.password-reset.dev-token-enabled:true}")
    private boolean resetDevTokenEnabled;

    @Value("${jobhunter.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${jobhunter.bootstrap.admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${jobhunter.swagger.enabled:true}")
    private boolean swaggerEnabled;

    public ProductionSafetyGuard(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateProductionSafety() {
        if (!enabled || !isProdProfile()) {
            return;
        }

        StringBuilder errors = new StringBuilder();
        if (jwtSecret == null || jwtSecret.isBlank() || LOCAL_DEV_JWT_SECRET.equals(jwtSecret) || !hasAtLeast64Bytes(jwtSecret)) {
            errors.append("JWT_BASE64_SECRET must be a non-default 64-byte base64 secret. ");
        }
        if (!secureCookie) {
            errors.append("JWT_COOKIE_SECURE must be true in prod. ");
        }
        if (resetDevTokenEnabled) {
            errors.append("PASSWORD_RESET_DEV_TOKEN_ENABLED must be false in prod. ");
        }
        if (seedEnabled) {
            errors.append("JOBHUNTER_SEED_ENABLED must be false in prod. ");
        }
        if (bootstrapAdminEnabled) {
            errors.append("JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED must be false in prod. ");
        }
        if (swaggerEnabled) {
            errors.append("JOBHUNTER_SWAGGER_ENABLED must be false in prod. ");
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Unsafe production configuration: " + errors);
        }
    }

    private boolean isProdProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile));
    }

    private boolean hasAtLeast64Bytes(String base64Secret) {
        try {
            return Base64.getDecoder().decode(base64Secret).length >= 64;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
