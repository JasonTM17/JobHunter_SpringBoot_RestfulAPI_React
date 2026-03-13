package com.vn.son.jobhunter.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomAuthenticationEntryPointTest {

    @Test
    void commenceShouldReturnUnauthorizedContractBody() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        CustomAuthenticationEntryPoint entryPoint = new CustomAuthenticationEntryPoint(objectMapper);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthenticationException authException = new BadCredentialsException("Bad credentials");

        entryPoint.commence(request, response, authException);

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.readValue(response.getContentAsString(), Map.class);

        assertEquals(401, response.getStatus());
        assertEquals(401, payload.get("statusCode"));
        assertEquals("UNAUTHORIZED", payload.get("error"));
        assertTrue(payload.get("message").toString().contains("đăng nhập"));
    }
}
