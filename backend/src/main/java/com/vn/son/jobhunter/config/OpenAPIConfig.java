package com.vn.son.jobhunter.config;

import com.vn.son.jobhunter.util.annotation.ApiMessage;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.util.List;

@Configuration
@ConditionalOnProperty(prefix = "jobhunter.swagger", name = "enabled", havingValue = "true", matchIfMissing = true)
public class OpenAPIConfig {
    private static final String SECURITY_SCHEME = "bearerAuth";

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI jobhunterOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(localServer()))
                .components(
                        new Components().addSecuritySchemes(
                                SECURITY_SCHEME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME));
    }

    @Bean
    public OperationCustomizer apiMessageOperationCustomizer() {
        return (operation, handlerMethod) -> {
            ApiMessage apiMessage = handlerMethod.getMethodAnnotation(ApiMessage.class);
            if (apiMessage != null && StringUtils.hasText(apiMessage.value())) {
                operation.setSummary(apiMessage.value());
                if (!StringUtils.hasText(operation.getDescription())) {
                    operation.setDescription(apiMessage.value());
                }
            }
            return operation;
        };
    }

    private Info apiInfo() {
        return new Info()
                .title("Jobhunter API")
                .version("v1")
                .description("Bộ tài liệu mô tả các API phục vụ nền tảng tuyển dụng Jobhunter.")
                .contact(
                        new Contact()
                                .name("Nguyễn Sơn")
                                .url("https://github.com/JasonTM17?tab=repositories")
                );
    }

    private Server localServer() {
        return new Server()
                .url("http://localhost:" + this.serverPort)
                .description("Máy chủ phát triển cục bộ");
    }
}
