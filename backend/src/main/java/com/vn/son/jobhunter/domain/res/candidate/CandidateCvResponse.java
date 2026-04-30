package com.vn.son.jobhunter.domain.res.candidate;

import java.time.Instant;

public record CandidateCvResponse(
        Long id,
        String fileUrl,
        String fileName,
        boolean defaultCv,
        Instant createdAt
) {
}
