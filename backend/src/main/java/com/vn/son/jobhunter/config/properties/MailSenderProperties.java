package com.vn.son.jobhunter.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jobhunter.mail")
public class MailSenderProperties {
    private boolean enabled = true;
    private String from = "xiaozhongli1710@gmail.com";
}
