package com.vn.son.jobhunter.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn.son.jobhunter.domain.res.RestResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class UnsafeMethodHeaderFilter extends OncePerRequestFilter {
    public static final String CLIENT_HEADER = "X-Jobhunter-Client";
    private static final Set<String> UNSAFE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${jobhunter.security.unsafe-method-header.enabled:true}")
    private boolean enabled;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled) return true;
        String path = request.getRequestURI();
        return !path.startsWith("/api/") || !UNSAFE_METHODS.contains(request.getMethod().toUpperCase());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(CLIENT_HEADER);
        if (!"web".equalsIgnoreCase(header)) {
            RestResponse<Object> body = new RestResponse<>();
            body.setStatusCode(HttpStatus.FORBIDDEN.value());
            body.setError("FORBIDDEN");
            body.setMessage("Yêu cầu thiếu header bảo vệ thao tác. Vui lòng tải lại trang và thử lại.");

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), body);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
