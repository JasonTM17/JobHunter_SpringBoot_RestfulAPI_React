package com.vn.son.jobhunter.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import com.vn.son.jobhunter.domain.Permission;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.util.error.IdInvalidException;
import com.vn.son.jobhunter.util.error.PermissionException;
import com.vn.son.jobhunter.util.security.SecurityUtils;

import java.util.Arrays;
import java.util.List;

@Transactional
public class PermissionInterceptor implements HandlerInterceptor {
    @Autowired
    UserService userService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response, Object handler)
            throws Exception {
        String path = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String httpMethod = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(httpMethod) || isPublicReadEndpoint(path, httpMethod)) {
            return true;
        }

        String email = SecurityUtils.getCurrentUserLogin().isPresent()
                ? SecurityUtils.getCurrentUserLogin().get()
                : "";
        if (email.isEmpty()) {
            return true;
        }

        User user = this.userService.handleGetUserByUsernameWithRolePermissions(email);
        if (user == null) {
            throw new PermissionException("You do not have permission to access this endpoint!!!");
        }

        Role role = user.getRole();
        if (role == null || role.getPermissions() == null || role.getPermissions().isEmpty()) {
            throw new PermissionException("You do not have permission to access this endpoint!!!");
        }

        List<Permission> permissions = role.getPermissions();
        boolean isAllow = permissions.stream().anyMatch(
                permission -> permission.getApiPath().equals(path)
                        && permission.getMethod().equalsIgnoreCase(httpMethod)
        );
        if (!isAllow) {
            throw new PermissionException("You do not have permission to access this endpoint!!!");
        }

        return true;
    }

    private boolean isPublicReadEndpoint(String path, String httpMethod) {
        if (!"GET".equalsIgnoreCase(httpMethod) || path == null) {
            return false;
        }
        return Arrays.asList(
                "/api/v1/jobs",
                "/api/v1/jobs/{id}",
                "/api/v1/companies",
                "/api/v1/companies/{id}",
                "/api/v1/skills"
        ).contains(path);
    }
}
