package com.vn.son.jobhunter.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jobhunter.mail.template")
public class MailTemplateProperties {
    private String appName = "Jobhunter";
    private String portalUrl = "http://localhost:3000";
    private String supportEmail = "support@jobhunter.local";
}
