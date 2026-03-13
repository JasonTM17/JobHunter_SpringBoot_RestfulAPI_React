package com.vn.son.jobhunter.integration;

import com.vn.son.jobhunter.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "apiPrefix=/api/v1",
        "spring.datasource.url=jdbc:h2:mem:security_it;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "son.jwt.base64-secret=QWNjZXNzVG9rZW5Gb3JUZXN0U2VjdXJlS2V5QWNjZXNzVG9rZW4xMjM0NTY=",
        "son.jwt.access-token-validity-in-seconds=900",
        "son.jwt.refresh-token-validity-in-seconds=604800",
        "jobhunter.swagger.enabled=true"
})
@AutoConfigureMockMvc(addFilters = true)
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmailService emailService;

    @Test
    void protectedUserEndpointShouldReturnUnauthorizedWhenNoToken() throws Exception {
        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));
    }

    @Test
    void actuatorHealthShouldRemainPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void actuatorLoggersShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/loggers"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));
    }

    @Test
    void swaggerUiShouldBePublicInLocalDev() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    void openApiDocsShouldBePublicInLocalDev() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth").exists());
    }
}
