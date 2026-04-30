package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.util.error.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class RateLimitService {
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Clock clock = Clock.systemUTC();

    @Value("${jobhunter.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${jobhunter.rate-limit.login.max:10}")
    private int loginMax;

    @Value("${jobhunter.rate-limit.login.window-seconds:60}")
    private long loginWindowSeconds;

    @Value("${jobhunter.rate-limit.password-reset.max:5}")
    private int passwordResetMax;

    @Value("${jobhunter.rate-limit.password-reset.window-seconds:900}")
    private long passwordResetWindowSeconds;

    @Value("${jobhunter.rate-limit.ai-chat.max:20}")
    private int aiChatMax;

    @Value("${jobhunter.rate-limit.ai-chat.window-seconds:60}")
    private long aiChatWindowSeconds;

    public void checkLogin(HttpServletRequest request, String email) throws RateLimitExceededException {
        check("login", ip(request) + ":" + normalize(email), loginMax, loginWindowSeconds);
    }

    public void checkPasswordReset(HttpServletRequest request, String emailOrToken) throws RateLimitExceededException {
        check("password-reset", ip(request) + ":" + normalize(emailOrToken), passwordResetMax, passwordResetWindowSeconds);
    }

    public void checkAiChat(HttpServletRequest request, String userKey) throws RateLimitExceededException {
        String identity = userKey == null || userKey.isBlank() ? ip(request) : normalize(userKey);
        check("ai-chat", identity, aiChatMax, aiChatWindowSeconds);
    }

    private void check(String policy, String identity, int maxRequests, long windowSeconds) throws RateLimitExceededException {
        if (!enabled || maxRequests <= 0 || windowSeconds <= 0) {
            return;
        }

        long now = Instant.now(clock).toEpochMilli();
        long windowMillis = windowSeconds * 1000L;
        String key = policy + ":" + identity;
        Bucket bucket = buckets.compute(key, (ignored, current) -> {
            if (current == null || now >= current.resetAtMillis) {
                return new Bucket(1, now + windowMillis);
            }
            current.count += 1;
            return current;
        });

        if (bucket.count > maxRequests) {
            throw new RateLimitExceededException("Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
        }

        if (buckets.size() > 10_000) {
            buckets.entrySet().removeIf(entry -> now >= entry.getValue().resetAtMillis);
        }
    }

    private String ip(HttpServletRequest request) {
        if (request == null) return "unknown";
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static final class Bucket {
        private int count;
        private final long resetAtMillis;

        private Bucket(int count, long resetAtMillis) {
            this.count = count;
            this.resetAtMillis = resetAtMillis;
        }
    }
}
