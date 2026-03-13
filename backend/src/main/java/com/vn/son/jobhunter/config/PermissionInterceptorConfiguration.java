package com.vn.son.jobhunter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PermissionInterceptorConfiguration implements WebMvcConfigurer {

    @Bean
    PermissionInterceptor getPermissionInterceptor() {
        return new PermissionInterceptor();
    }
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        String[] whiteList = {
                "/",
                "/api/v1/auth/**",
                "/storage/**",
                "/api/v1/ai/**",
                "/actuator/health",
                "/actuator/health/**",
                "/actuator/info",
                "/v3/api-docs",
                "/v3/api-docs/**",
                "/v3/api-docs.yaml",
                "/swagger-ui",
                "/swagger-ui/**",
                "/swagger-ui.html"
        };
        registry.addInterceptor(getPermissionInterceptor())
                .excludePathPatterns(whiteList);
    }
}
