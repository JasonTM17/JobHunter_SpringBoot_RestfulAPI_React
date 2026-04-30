package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.PasswordResetToken;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.auth.ForgotPasswordResponse;
import com.vn.son.jobhunter.repository.PasswordResetTokenRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        this.passwordResetService = new PasswordResetService(
                userRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                emailService
        );
        ReflectionTestUtils.setField(passwordResetService, "tokenTtlMinutes", 30L);
        ReflectionTestUtils.setField(passwordResetService, "devTokenEnabled", true);
        ReflectionTestUtils.setField(passwordResetService, "portalUrl", "http://localhost:3010");
    }

    @Test
    void requestResetShouldReturnGenericMessageWithoutCreatingTokenForUnknownEmail() {
        when(userRepository.findOneByEmail("missing@jobhunter.local")).thenReturn(Optional.empty());

        ForgotPasswordResponse response = passwordResetService.requestReset(" Missing@Jobhunter.Local ");

        assertNotNull(response.getMessage());
        assertNull(response.getDevResetToken());
        assertNull(response.getExpiresAt());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void requestResetShouldCreateHashedTokenAndExposeDevTokenWhenEnabled() {
        User user = new User();
        user.setId(5L);
        user.setEmail("candidate@jobhunter.local");
        user.setName("Candidate");

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(user));
        when(emailService.isMailConfigured()).thenReturn(false);
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ForgotPasswordResponse response = passwordResetService.requestReset(" Candidate@Jobhunter.Local ");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();

        assertEquals(user, savedToken.getUser());
        assertNotNull(savedToken.getTokenHash());
        assertEquals(64, savedToken.getTokenHash().length());
        assertTrue(savedToken.getExpiresAt().isAfter(Instant.now()));
        assertNotNull(response.getDevResetToken());
        assertEquals(savedToken.getExpiresAt(), response.getExpiresAt());
    }

    @Test
    void resetPasswordShouldEncodePasswordConsumeTokenAndClearRefreshToken() throws Exception {
        User user = new User();
        user.setId(5L);
        user.setEmail("candidate@jobhunter.local");
        user.setRefreshToken("old-refresh-token");

        when(userRepository.findOneByEmail("candidate@jobhunter.local")).thenReturn(Optional.of(user));
        when(emailService.isMailConfigured()).thenReturn(false);
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ForgotPasswordResponse response = passwordResetService.requestReset("candidate@jobhunter.local");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();

        when(passwordResetTokenRepository.findByTokenHash(savedToken.getTokenHash())).thenReturn(Optional.of(savedToken));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-password");

        passwordResetService.resetPassword(response.getDevResetToken(), "new-password");

        assertEquals("encoded-password", user.getPassword());
        assertNull(user.getRefreshToken());
        assertNotNull(savedToken.getUsedAt());
        verify(userRepository).save(user);
    }

    @Test
    void resetPasswordShouldRejectExpiredOrUsedToken() {
        PasswordResetToken token = new PasswordResetToken();
        token.setExpiresAt(Instant.now().minusSeconds(60));
        token.setUser(new User());

        when(passwordResetTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> passwordResetService.resetPassword("expired-token", "new-password"));
    }
}
