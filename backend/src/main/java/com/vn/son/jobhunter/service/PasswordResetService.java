package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.PasswordResetToken;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.auth.ForgotPasswordResponse;
import com.vn.son.jobhunter.domain.res.auth.ResetPasswordResponse;
import com.vn.son.jobhunter.repository.PasswordResetTokenRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final String GENERIC_FORGOT_MESSAGE =
            "Nếu email tồn tại trong hệ thống, Jobhunter sẽ gửi hướng dẫn đặt lại mật khẩu.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jobhunter.auth.password-reset.ttl-minutes:30}")
    private long tokenTtlMinutes;

    @Value("${jobhunter.auth.password-reset.dev-token-enabled:true}")
    private boolean devTokenEnabled;

    @Value("${jobhunter.mail.template.portal-url:http://localhost:3010}")
    private String portalUrl;

    @Transactional
    public ForgotPasswordResponse requestReset(String email) {
        String normalizedEmail = normalizeEmail(email);
        Optional<User> userOptional = this.userRepository.findOneByEmail(normalizedEmail);
        if (userOptional.isEmpty()) {
            return new ForgotPasswordResponse(GENERIC_FORGOT_MESSAGE, null, null);
        }

        User user = userOptional.get();
        String rawToken = createRawToken();
        Instant expiresAt = Instant.now().plusSeconds(Math.max(5, this.tokenTtlMinutes) * 60);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(expiresAt);
        this.passwordResetTokenRepository.save(token);

        if (this.emailService.isMailConfigured()) {
            sendResetEmailSafely(user, rawToken);
        }

        return new ForgotPasswordResponse(
                GENERIC_FORGOT_MESSAGE,
                this.devTokenEnabled ? rawToken : null,
                this.devTokenEnabled ? expiresAt : null
        );
    }

    @Transactional
    public ResetPasswordResponse resetPassword(String rawToken, String password) throws BadRequestException {
        String tokenValue = rawToken == null ? "" : rawToken.trim();
        if (tokenValue.isBlank()) {
            throw new BadRequestException("Reset token is required");
        }

        PasswordResetToken resetToken = this.passwordResetTokenRepository.findByTokenHash(hashToken(tokenValue))
                .orElseThrow(() -> new BadRequestException("Reset link is invalid or expired"));

        Instant now = Instant.now();
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(now)) {
            throw new BadRequestException("Reset link is invalid or expired");
        }

        User user = resetToken.getUser();
        user.setPassword(this.passwordEncoder.encode(password));
        user.setRefreshToken(null);
        resetToken.setUsedAt(now);
        this.userRepository.save(user);
        this.passwordResetTokenRepository.save(resetToken);

        return new ResetPasswordResponse("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.");
    }

    private void sendResetEmailSafely(User user, String rawToken) {
        String resetUrl = this.portalUrl.replaceAll("/+$", "")
                + "/forgot-password?token="
                + rawToken;
        String body = "Xin chào " + safeName(user) + ",\n\n"
                + "Bạn vừa yêu cầu đặt lại mật khẩu Jobhunter.\n"
                + "Mở liên kết sau trong vòng " + this.tokenTtlMinutes + " phút:\n"
                + resetUrl + "\n\n"
                + "Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.";
        try {
            this.emailService.sendTextEmail(user.getEmail(), "Đặt lại mật khẩu Jobhunter", body);
        } catch (MailDeliveryException ignored) {
            // The forgot-password endpoint must not reveal email delivery state.
        }
    }

    private String safeName(User user) {
        String name = user.getName() == null ? "" : user.getName().trim();
        return name.isBlank() ? "bạn" : name;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String createRawToken() {
        byte[] bytes = new byte[32];
        this.secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot hash reset token", ex);
        }
    }
}
