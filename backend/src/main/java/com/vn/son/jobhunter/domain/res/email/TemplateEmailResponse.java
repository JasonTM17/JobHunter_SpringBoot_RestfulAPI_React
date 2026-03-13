package com.vn.son.jobhunter.domain.res.email;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class TemplateEmailResponse {
    private String recipient;
    private String sender;
    private String subject;
    private String templateName;
    private Instant sentAt;
}
