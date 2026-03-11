package com.vn.son.jobhunter.util.security;

import org.springframework.data.domain.AuditorAware;
import com.vn.son.jobhunter.util.security.SecurityUtils;

import java.util.Optional;

public class SpringSecurityAuditorAware implements AuditorAware<String> {
    @Override
    public Optional<String> getCurrentAuditor() {
        return Optional.of(SecurityUtils.getCurrentUserLogin().orElse("system"));
    }
}
