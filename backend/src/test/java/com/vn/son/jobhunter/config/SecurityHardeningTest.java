package com.vn.son.jobhunter.config;

import com.vn.son.jobhunter.service.RateLimitService;
import com.vn.son.jobhunter.util.error.RateLimitExceededException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SecurityHardeningTest {

    @Test
    void unsafeMethodFilterShouldRejectMissingClientHeader() throws Exception {
        UnsafeMethodHeaderFilter filter = new UnsafeMethodHeaderFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/resumes");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("FORBIDDEN"));
    }

    @Test
    void unsafeMethodFilterShouldAllowTrustedWebClientHeader() throws Exception {
        UnsafeMethodHeaderFilter filter = new UnsafeMethodHeaderFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);

        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/v1/resumes/1/status");
        request.addHeader(UnsafeMethodHeaderFilter.CLIENT_HEADER, "web");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals(request, chain.getRequest());
    }

    @Test
    void rateLimitShouldBlockRequestsPastConfiguredWindowLimit() throws Exception {
        RateLimitService rateLimitService = new RateLimitService();
        ReflectionTestUtils.setField(rateLimitService, "enabled", true);
        ReflectionTestUtils.setField(rateLimitService, "loginMax", 1);
        ReflectionTestUtils.setField(rateLimitService, "loginWindowSeconds", 60L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");

        rateLimitService.checkLogin(request, "candidate@example.com");

        assertThrows(
                RateLimitExceededException.class,
                () -> rateLimitService.checkLogin(request, "candidate@example.com")
        );
    }

    @Test
    void productionGuardShouldFailFastForUnsafeProdConfiguration() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        ProductionSafetyGuard guard = new ProductionSafetyGuard(environment);
        ReflectionTestUtils.setField(guard, "enabled", true);
        ReflectionTestUtils.setField(guard, "jwtSecret", "g/AYKfaK6dDKXZFgopotLApRTC79KZo9uIWfWCXH/bKPDt3TgG4jEX5Dm+hboY2TJmEuyVPXbSrNpvgD/SGu4A==");
        ReflectionTestUtils.setField(guard, "secureCookie", false);
        ReflectionTestUtils.setField(guard, "resetDevTokenEnabled", true);
        ReflectionTestUtils.setField(guard, "seedEnabled", true);
        ReflectionTestUtils.setField(guard, "bootstrapAdminEnabled", true);
        ReflectionTestUtils.setField(guard, "swaggerEnabled", true);

        IllegalStateException error = assertThrows(IllegalStateException.class, guard::validateProductionSafety);

        assertTrue(error.getMessage().contains("Unsafe production configuration"));
        assertTrue(error.getMessage().contains("JWT_BASE64_SECRET"));
        assertTrue(error.getMessage().contains("JWT_COOKIE_SECURE"));
    }

    @Test
    void productionGuardShouldNotRunOutsideProdProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        ProductionSafetyGuard guard = new ProductionSafetyGuard(environment);
        ReflectionTestUtils.setField(guard, "enabled", true);
        ReflectionTestUtils.setField(guard, "jwtSecret", "");
        ReflectionTestUtils.setField(guard, "secureCookie", false);
        ReflectionTestUtils.setField(guard, "resetDevTokenEnabled", true);
        ReflectionTestUtils.setField(guard, "seedEnabled", true);
        ReflectionTestUtils.setField(guard, "bootstrapAdminEnabled", true);
        ReflectionTestUtils.setField(guard, "swaggerEnabled", true);

        assertDoesNotThrow(guard::validateProductionSafety);
    }
}
