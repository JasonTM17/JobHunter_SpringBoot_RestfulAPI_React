package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.res.email.LogCleanupTriggerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogCleanupSchedulerService {
    private static final Set<String> FORBIDDEN_PATH_SEGMENTS = Set.of(
            "src", "frontend", "backend", ".git", "node_modules", "uploads", "upload", "templates", "resources"
    );
    private static final Pattern SAFE_RELATIVE_PATH = Pattern.compile("^[a-zA-Z0-9_./-]+$");

    private final SchedulerProperties schedulerProperties;
    private final Environment environment;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Scheduled(
            cron = "${jobhunter.scheduler.log-cleanup.cron:0 0 3 * * *}",
            zone = "${jobhunter.scheduler.log-cleanup.zone:Asia/Ho_Chi_Minh}"
    )
    public void runLogCleanupSchedule() {
        LogCleanupTriggerResponse response = executeCleanup("cron", false, false);
        if (!"SKIPPED".equalsIgnoreCase(response.getStatus()) || response.getDeletedFiles() > 0 || response.getErrorCount() > 0) {
            log.info(
                    "Log cleanup status={} code={} scanned={} deleted={} skipped={} errors={}",
                    response.getStatus(),
                    response.getCode(),
                    response.getScannedFiles(),
                    response.getDeletedFiles(),
                    response.getSkippedFiles(),
                    response.getErrorCount()
            );
        }
    }

    public LogCleanupTriggerResponse triggerManually() {
        return executeCleanup("manual", true, true);
    }

    private LogCleanupTriggerResponse executeCleanup(String triggerSource, boolean verboseLog, boolean manualTrigger) {
        LogCleanupTriggerResponse response = new LogCleanupTriggerResponse();
        response.setTriggerSource(triggerSource);
        response.setTriggeredAt(Instant.now());

        SchedulerProperties.LogCleanup settings = this.schedulerProperties.getLogCleanup();
        if (!settings.isEnabled()) {
            return skip(response, "LOG_CLEANUP_DISABLED", "Tác vụ dọn log định kỳ đang tắt.");
        }
        if (manualTrigger && !isManualTriggerAllowed(settings)) {
            return skip(response, "MANUAL_TRIGGER_DISABLED", "Không cho phép trigger dọn log trong môi trường hiện tại.");
        }
        if (!running.compareAndSet(false, true)) {
            return skip(response, "SCHEDULER_BUSY", "Tác vụ dọn log đang chạy, vui lòng thử lại sau.");
        }

        try {
            int retentionDays = Math.max(1, settings.getRetentionDays());
            int maxScanFiles = Math.max(100, settings.getMaxScanFiles());
            Instant threshold = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
            Set<Path> cleanupRoots = resolveCleanupRoots(settings.getPaths());
            List<String> includePatterns = resolveIncludePatterns(settings.getIncludePatterns());

            response.setRetentionDays(retentionDays);
            if (cleanupRoots.isEmpty()) {
                return skip(response, "NO_CLEANUP_PATH", "Không có đường dẫn dọn log hợp lệ.");
            }
            if (includePatterns.isEmpty()) {
                return skip(response, "NO_PATTERN", "Chưa cấu hình mẫu file log để dọn.");
            }

            int scannedFiles = 0;
            int deletedFiles = 0;
            int skippedFiles = 0;
            int errorCount = 0;
            boolean scanLimitReached = false;

            for (Path root : cleanupRoots) {
                if (scannedFiles >= maxScanFiles) {
                    scanLimitReached = true;
                    break;
                }
                int remainingScanQuota = maxScanFiles - scannedFiles;
                CleanupStats stats = cleanupRoot(root, threshold, includePatterns, remainingScanQuota);
                scannedFiles += stats.scannedFiles;
                deletedFiles += stats.deletedFiles;
                skippedFiles += stats.skippedFiles;
                errorCount += stats.errorCount;
                if (stats.scanLimitReached) {
                    scanLimitReached = true;
                    break;
                }
            }

            response.setScannedFiles(scannedFiles);
            response.setDeletedFiles(deletedFiles);
            response.setSkippedFiles(skippedFiles + (scanLimitReached ? 1 : 0));
            response.setErrorCount(errorCount);

            response.setStatus(errorCount > 0 && deletedFiles == 0 ? "FAILED" : "SUCCESS");
            response.setCode(scanLimitReached ? "LOG_CLEANUP_PARTIAL" : "LOG_CLEANUP_COMPLETED");
            response.setMessage(scanLimitReached
                    ? "Đã dọn log một phần do đạt giới hạn quét trong lần chạy."
                    : "Đã hoàn tất dọn log định kỳ.");

            if (verboseLog) {
                log.info(
                        "Manual log cleanup result status={} scanned={} deleted={} skipped={} errors={}",
                        response.getStatus(),
                        response.getScannedFiles(),
                        response.getDeletedFiles(),
                        response.getSkippedFiles(),
                        response.getErrorCount()
                );
            }
            return response;
        } catch (Exception ex) {
            response.setStatus("FAILED");
            response.setCode("LOG_CLEANUP_ERROR");
            response.setMessage("Tác vụ dọn log gặp lỗi tạm thời.");
            log.error("Unexpected log cleanup error", ex);
            return response;
        } finally {
            running.set(false);
        }
    }

    private CleanupStats cleanupRoot(Path root, Instant threshold, List<String> includePatterns, int maxScanFiles) {
        CleanupStats stats = new CleanupStats();
        if (!Files.exists(root)) {
            return stats;
        }

        try (var stream = Files.walk(root)) {
            var iterator = stream.iterator();
            while (iterator.hasNext()) {
                Path candidate = iterator.next().toAbsolutePath().normalize();
                if (!candidate.startsWith(root)) {
                    continue;
                }
                if (!Files.isRegularFile(candidate, LinkOption.NOFOLLOW_LINKS)) {
                    continue;
                }
                if (!matchesAnyPattern(candidate.getFileName().toString(), includePatterns)) {
                    continue;
                }

                stats.scannedFiles++;
                if (stats.scannedFiles > maxScanFiles) {
                    stats.scanLimitReached = true;
                    stats.skippedFiles++;
                    break;
                }

                try {
                    Instant lastModified = Files.getLastModifiedTime(candidate, LinkOption.NOFOLLOW_LINKS).toInstant();
                    if (lastModified.isAfter(threshold)) {
                        stats.skippedFiles++;
                        continue;
                    }
                    if (Files.deleteIfExists(candidate)) {
                        stats.deletedFiles++;
                    } else {
                        stats.skippedFiles++;
                    }
                } catch (IOException ioException) {
                    stats.errorCount++;
                    log.warn("Log cleanup failed for file={} reason={}", candidate, ioException.getMessage());
                }
            }
        } catch (IOException ex) {
            stats.errorCount++;
            log.warn("Cannot scan log cleanup path={} reason={}", root, ex.getMessage());
        }

        return stats;
    }

    private Set<Path> resolveCleanupRoots(String rawPaths) {
        Set<Path> roots = new LinkedHashSet<>();
        for (String rawPath : splitCommaValues(rawPaths)) {
            String pathValue = rawPath.trim();
            if (!StringUtils.hasText(pathValue)) {
                continue;
            }
            if (pathValue.contains("..")) {
                continue;
            }
            if (isRelativePath(pathValue) && !SAFE_RELATIVE_PATH.matcher(pathValue).matches()) {
                continue;
            }

            Path normalized = Paths.get(pathValue).toAbsolutePath().normalize();
            if (!isCleanupPathAllowed(normalized)) {
                continue;
            }
            roots.add(normalized);
        }
        return roots;
    }

    private boolean isCleanupPathAllowed(Path path) {
        String normalizedPath = path.toString().toLowerCase(Locale.ROOT);
        if (!normalizedPath.contains("log")) {
            return false;
        }
        for (Path segment : path) {
            String value = segment.toString().toLowerCase(Locale.ROOT);
            if (FORBIDDEN_PATH_SEGMENTS.contains(value)) {
                return false;
            }
        }
        return true;
    }

    private List<String> resolveIncludePatterns(String rawPatterns) {
        return splitCommaValues(rawPatterns).stream()
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .toList();
    }

    private boolean matchesAnyPattern(String fileName, List<String> patterns) {
        String normalized = fileName == null ? "" : fileName.trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            return false;
        }
        for (String pattern : patterns) {
            String regex = toRegex(pattern);
            if (normalized.matches(regex)) {
                return true;
            }
        }
        return false;
    }

    private String toRegex(String globPattern) {
        StringBuilder builder = new StringBuilder("^");
        for (int i = 0; i < globPattern.length(); i++) {
            char current = globPattern.charAt(i);
            if (current == '*') {
                builder.append(".*");
                continue;
            }
            if (current == '?') {
                builder.append('.');
                continue;
            }
            if ("\\.[]{}()+-^$|".indexOf(current) >= 0) {
                builder.append('\\');
            }
            builder.append(current);
        }
        builder.append('$');
        return builder.toString();
    }

    private boolean isManualTriggerAllowed(SchedulerProperties.LogCleanup settings) {
        if (settings.isManualTriggerEnabled()) {
            return true;
        }

        Set<String> allowedProfiles = new HashSet<>();
        for (String profile : splitCommaValues(settings.getManualTriggerAllowedProfiles())) {
            String normalized = profile.trim().toLowerCase(Locale.ROOT);
            if (StringUtils.hasText(normalized)) {
                allowedProfiles.add(normalized);
            }
        }
        if (allowedProfiles.isEmpty()) {
            return false;
        }

        String[] activeProfiles = this.environment.getActiveProfiles();
        if (activeProfiles == null || activeProfiles.length == 0) {
            return false;
        }
        for (String profile : activeProfiles) {
            if (profile == null) {
                continue;
            }
            String normalized = profile.trim().toLowerCase(Locale.ROOT);
            if (allowedProfiles.contains(normalized)) {
                return true;
            }
        }
        return false;
    }

    private boolean isRelativePath(String value) {
        return !Paths.get(value).isAbsolute();
    }

    private List<String> splitCommaValues(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return List.of();
        }
        return Arrays.stream(rawValue.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }

    private LogCleanupTriggerResponse skip(LogCleanupTriggerResponse response, String code, String message) {
        response.setStatus("SKIPPED");
        response.setCode(code);
        response.setMessage(message);
        response.setRetentionDays(Math.max(1, this.schedulerProperties.getLogCleanup().getRetentionDays()));
        response.setScannedFiles(0);
        response.setDeletedFiles(0);
        response.setSkippedFiles(0);
        response.setErrorCount(0);
        return response;
    }

    private static class CleanupStats {
        private int scannedFiles = 0;
        private int deletedFiles = 0;
        private int skippedFiles = 0;
        private int errorCount = 0;
        private boolean scanLimitReached = false;
    }
}
