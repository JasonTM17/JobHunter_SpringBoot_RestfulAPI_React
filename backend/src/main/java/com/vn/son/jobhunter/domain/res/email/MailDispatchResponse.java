package com.vn.son.jobhunter.domain.res.email;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class MailDispatchResponse {
    private String message;
    private Instant dispatchedAt;
}
