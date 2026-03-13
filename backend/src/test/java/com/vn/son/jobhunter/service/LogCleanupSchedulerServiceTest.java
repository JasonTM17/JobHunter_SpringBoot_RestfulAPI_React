package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.res.email.LogCleanupTriggerResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogCleanupSchedulerServiceTest {

    @Mock
    private Environment environment;

    @TempDir
    Path tempDir;

    private SchedulerProperties schedulerProperties;
    private LogCleanupSchedulerService service;

    @BeforeEach
    void setUp() {
        schedulerProperties = new SchedulerProperties();
        schedulerProperties.setEnabled(true);
        schedulerProperties.getLogCleanup().setEnabled(true);
        schedulerProperties.getLogCleanup().setRetentionDays(7);
        schedulerProperties.getLogCleanup().setIncludePatterns("*.log,*.log.*");
        schedulerProperties.getLogCleanup().setMaxScanFiles(1000);
        schedulerProperties.getLogCleanup().setManualTriggerEnabled(true);

        service = new LogCleanupSchedulerService(
                schedulerProperties,
                environment
        );
    }

    @Test
    void triggerManuallyShouldSkipWhenCleanupDisabled() {
        schedulerProperties.getLogCleanup().setEnabled(false);

        LogCleanupTriggerResponse response = service.triggerManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("LOG_CLEANUP_DISABLED", response.getCode());
    }

    @Test
    void triggerManuallyShouldSkipWhenManualTriggerProfileNotAllowed() {
        schedulerProperties.getLogCleanup().setManualTriggerEnabled(false);
        schedulerProperties.getLogCleanup().setManualTriggerAllowedProfiles("dev,local");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        LogCleanupTriggerResponse response = service.triggerManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MANUAL_TRIGGER_DISABLED", response.getCode());
    }

    @Test
    void triggerManuallyShouldDeleteOnlyOldLogFiles() throws Exception {
        Path logsDir = tempDir.resolve("logs");
        Files.createDirectories(logsDir);
        Path oldLog = logsDir.resolve("old.log");
        Path newLog = logsDir.resolve("new.log");
        Path nonLog = logsDir.resolve("note.txt");

        Files.writeString(oldLog, "old");
        Files.writeString(newLog, "new");
        Files.writeString(nonLog, "keep");

        Files.setLastModifiedTime(oldLog, FileTime.from(Instant.now().minus(15, ChronoUnit.DAYS)));
        Files.setLastModifiedTime(newLog, FileTime.from(Instant.now().minus(1, ChronoUnit.DAYS)));
        Files.setLastModifiedTime(nonLog, FileTime.from(Instant.now().minus(15, ChronoUnit.DAYS)));

        schedulerProperties.getLogCleanup().setPaths(logsDir.toString());

        LogCleanupTriggerResponse response = service.triggerManually();

        assertEquals("SUCCESS", response.getStatus());
        assertEquals("LOG_CLEANUP_COMPLETED", response.getCode());
        assertTrue(response.getScannedFiles() >= 2);
        assertEquals(1, response.getDeletedFiles());
        assertFalse(Files.exists(oldLog));
        assertTrue(Files.exists(newLog));
        assertTrue(Files.exists(nonLog));
    }
}
