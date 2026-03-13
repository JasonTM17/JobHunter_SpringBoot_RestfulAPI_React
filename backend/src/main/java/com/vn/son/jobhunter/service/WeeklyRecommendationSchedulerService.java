package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.MailTemplateProperties;
import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.Subscriber;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.WeeklyRecommendationDispatch;
import com.vn.son.jobhunter.domain.res.email.WeeklyRecommendationTriggerResponse;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.ResumeRepository;
import com.vn.son.jobhunter.repository.SubscriberRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.repository.WeeklyRecommendationDispatchRepository;
import com.vn.son.jobhunter.util.constant.LevelEnum;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyRecommendationSchedulerService {
    private static final String RECOMMENDATION_TEMPLATE = "mail/weekly-job-recommendation";
    private static final String CANDIDATE_ROLE = "USER";
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Locale VIETNAMESE_LOCALE = Locale.forLanguageTag("vi-VN");
    private static final Set<String> TITLE_STOP_WORDS = Set.of(
            "developer", "engineer", "intern", "fresher", "junior", "middle", "senior",
            "fullstack", "backend", "frontend", "specialist", "staff", "nhan", "vien", "thuc", "tap"
    );

    private final SchedulerProperties schedulerProperties;
    private final MailTemplateProperties mailTemplateProperties;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final SubscriberRepository subscriberRepository;
    private final WeeklyRecommendationDispatchRepository dispatchRepository;
    private final Environment environment;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Scheduled(
            cron = "${jobhunter.scheduler.weekly-recommendation.cron:0 0 8 * * MON}",
            zone = "${jobhunter.scheduler.weekly-recommendation.zone:Asia/Ho_Chi_Minh}"
    )
    public void runWeeklyRecommendationSchedule() {
        WeeklyRecommendationTriggerResponse response = executeBatch("cron", false, false);
        if (!"SKIPPED".equalsIgnoreCase(response.getStatus()) || response.getSentCount() > 0 || response.getFailedCount() > 0) {
            log.info(
                    "Weekly recommendation batch status={} code={} evaluated={} sent={} failed={} skipped={}",
                    response.getStatus(),
                    response.getCode(),
                    response.getEvaluatedCandidates(),
                    response.getSentCount(),
                    response.getFailedCount(),
                    response.getSkippedCount()
            );
        }
    }

    public WeeklyRecommendationTriggerResponse triggerManually() {
        return executeBatch("manual", true, true);
    }

    private WeeklyRecommendationTriggerResponse executeBatch(
            String triggerSource,
            boolean verboseLog,
            boolean manualTrigger
    ) {
        WeeklyRecommendationTriggerResponse response = new WeeklyRecommendationTriggerResponse();
        response.setTriggerSource(triggerSource);
        response.setTriggeredAt(Instant.now());

        SchedulerProperties.WeeklyRecommendation settings = this.schedulerProperties.getWeeklyRecommendation();
        if (!settings.isEnabled()) {
            return skip(response, "WEEKLY_RECOMMENDATION_DISABLED", "Lịch gửi gợi ý việc làm hằng tuần đang tắt.");
        }
        if (!this.emailService.isMailConfigured()) {
            return skip(response, "MAIL_NOT_CONFIGURED", "Dịch vụ email chưa sẵn sàng.");
        }
        if (manualTrigger && !isManualTriggerAllowed(settings)) {
            return skip(response, "MANUAL_TRIGGER_DISABLED", "Không cho phép trigger thủ công trong môi trường hiện tại.");
        }
        if (!running.compareAndSet(false, true)) {
            return skip(response, "SCHEDULER_BUSY", "Tác vụ gợi ý hằng tuần đang chạy, vui lòng thử lại sau.");
        }

        try {
            ZoneId zone = resolveZone(settings.getZone());
            ZonedDateTime now = ZonedDateTime.now(zone);
            Instant nowInstant = now.toInstant();
            String weekKey = weekKey(now);
            response.setWeekKey(weekKey);

            List<User> candidateUsers = loadCandidateUsers(settings);
            response.setTotalCandidates(candidateUsers.size());
            if (candidateUsers.isEmpty()) {
                return skip(response, "NO_CANDIDATES", "Không có ứng viên phù hợp để gửi email tuần này.");
            }

            List<Job> openJobs = this.jobRepository.findOpenJobs(nowInstant);
            if (openJobs.isEmpty()) {
                return skip(response, "NO_OPEN_JOBS", "Hiện không có công việc đang mở để gợi ý.");
            }

            Map<Long, List<Resume>> resumesByUserId = loadResumesByUser(candidateUsers);
            Map<String, Subscriber> subscriberByEmail = loadSubscribersByEmail(candidateUsers);
            Set<String> dispatchedEmailsThisWeek = new HashSet<>(
                    this.dispatchRepository.findEmailsByWeekKey(weekKey).stream()
                            .map(this::normalizeEmail)
                            .filter(StringUtils::hasText)
                            .toList()
            );

            int evaluated = 0;
            int sent = 0;
            int failed = 0;
            int skipped = 0;

            for (User user : candidateUsers) {
                String email = normalizeEmail(user.getEmail());
                if (!isValidEmail(email)) {
                    skipped++;
                    continue;
                }
                if (dispatchedEmailsThisWeek.contains(email)) {
                    skipped++;
                    continue;
                }

                evaluated++;
                List<Resume> userResumes = resumesByUserId.getOrDefault(user.getId(), List.of());
                Subscriber subscriber = subscriberByEmail.get(email);
                List<RecommendedJob> recommendations = recommendJobsForUser(userResumes, subscriber, openJobs, nowInstant, settings);

                if (recommendations.isEmpty()) {
                    skipped++;
                    continue;
                }

                Map<String, Object> variables = new HashMap<>();
                variables.put("recipientName", resolveRecipientName(user.getName()));
                variables.put("recommendationWeek", formatRecommendationWeek(now));
                variables.put("jobs", recommendations);
                variables.put("openJobsUrl", buildOpenJobsUrl());
                variables.put("settingsUrl", buildEmailSettingsUrl());
                variables.put("previewText", "Gợi ý việc làm phù hợp cho bạn trong tuần này.");
                variables.put("summaryText", "Jobhunter đã chọn các công việc phù hợp hơn với kỹ năng và lịch sử ứng tuyển của bạn.");

                try {
                    this.emailService.sendTemplateEmail(
                            email,
                            "Gợi ý việc làm dành cho bạn tuần này",
                            RECOMMENDATION_TEMPLATE,
                            variables
                    );
                    this.dispatchRepository.save(createDispatch(email, weekKey, triggerSource, recommendations.size(), nowInstant));
                    dispatchedEmailsThisWeek.add(email);
                    sent++;
                } catch (MailDeliveryException ex) {
                    failed++;
                    log.warn(
                            "Weekly recommendation mail failed code={} user={}",
                            ex.getErrorCode(),
                            maskEmail(email)
                    );
                }
            }

            response.setEvaluatedCandidates(evaluated);
            response.setSentCount(sent);
            response.setFailedCount(failed);
            response.setSkippedCount(skipped);

            if (sent == 0 && failed > 0) {
                response.setStatus("FAILED");
                response.setCode("WEEKLY_RECOMMENDATION_FAILED");
                response.setMessage("Không thể gửi email gợi ý việc làm trong lần chạy này.");
            } else {
                response.setStatus("SUCCESS");
                response.setCode("WEEKLY_RECOMMENDATION_COMPLETED");
                response.setMessage("Đã hoàn tất tác vụ gửi gợi ý việc làm hằng tuần.");
            }

            if (verboseLog) {
                log.info(
                        "Manual weekly recommendation result status={} evaluated={} sent={} failed={} skipped={}",
                        response.getStatus(),
                        evaluated,
                        sent,
                        failed,
                        skipped
                );
            }
            return response;
        } catch (Exception ex) {
            response.setStatus("FAILED");
            response.setCode("WEEKLY_RECOMMENDATION_ERROR");
            response.setMessage("Tác vụ gợi ý việc làm gặp lỗi tạm thời.");
            log.error("Unexpected weekly recommendation error", ex);
            return response;
        } finally {
            running.set(false);
        }
    }

    private List<User> loadCandidateUsers(SchedulerProperties.WeeklyRecommendation settings) {
        int pageSize = Math.max(20, settings.getCandidatePageSize());
        int maxCandidates = settings.getMaxCandidatesPerRun() <= 0
                ? Integer.MAX_VALUE
                : settings.getMaxCandidatesPerRun();

        List<User> users = new ArrayList<>();
        int page = 0;

        while (users.size() < maxCandidates) {
            Page<User> candidatePage = this.userRepository
                    .findByRole_NameIgnoreCaseAndWeeklyJobRecommendationEnabledTrue(
                            CANDIDATE_ROLE,
                            PageRequest.of(page, pageSize)
                    );
            if (candidatePage.isEmpty()) {
                break;
            }

            List<User> content = candidatePage.getContent();
            int remainingSlots = maxCandidates - users.size();
            if (content.size() > remainingSlots) {
                content = content.subList(0, remainingSlots);
            }
            users.addAll(content);

            if (!candidatePage.hasNext() || users.size() >= maxCandidates) {
                break;
            }
            page++;
        }

        return users;
    }

    private boolean isManualTriggerAllowed(SchedulerProperties.WeeklyRecommendation settings) {
        if (settings.isManualTriggerEnabled()) {
            return true;
        }

        Set<String> allowedProfiles = Arrays.stream(
                        safeText(settings.getManualTriggerAllowedProfiles(), "")
                                .split(",")
                )
                .map(String::trim)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());

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
            if (allowedProfiles.contains(profile.trim().toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private List<RecommendedJob> recommendJobsForUser(
            List<Resume> resumes,
            Subscriber subscriber,
            List<Job> openJobs,
            Instant now,
            SchedulerProperties.WeeklyRecommendation settings
    ) {
        Set<Long> appliedJobIds = resumes.stream()
                .map(Resume::getJob)
                .filter(job -> job != null && job.getId() != null)
                .map(Job::getId)
                .collect(Collectors.toCollection(HashSet::new));

        List<Resume> recentResumes = filterRecentResumes(resumes, now, settings.getRecentApplyDays());
        Set<String> preferredSkills = collectPreferredSkills(recentResumes, subscriber);
        Set<String> preferredKeywords = collectPreferredKeywords(recentResumes);

        int maxJobs = Math.max(1, settings.getMaxJobsPerUser());
        List<ScoredJob> scoredJobs = new ArrayList<>();

        for (Job job : openJobs) {
            if (job.getId() == null || appliedJobIds.contains(job.getId())) {
                continue;
            }

            int skillMatches = countSkillMatches(job, preferredSkills);
            int keywordMatches = countTitleKeywordMatches(job, preferredKeywords);
            int score = skillMatches * 3 + keywordMatches * 2;
            if (score > 0) {
                scoredJobs.add(new ScoredJob(job, score));
            }
        }

        List<Job> selectedJobs = scoredJobs.stream()
                .sorted(Comparator
                        .comparingInt(ScoredJob::score).reversed()
                        .thenComparing(scored -> scored.job().getEndDate(), Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(scored -> scored.job().getCreatedDate(), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(ScoredJob::job)
                .limit(maxJobs)
                .toList();

        if (selectedJobs.isEmpty() && settings.isFallbackEnabled()) {
            selectedJobs = openJobs.stream()
                    .filter(job -> job.getId() != null && !appliedJobIds.contains(job.getId()))
                    .sorted(Comparator
                            .comparing(Job::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(Job::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(maxJobs)
                    .toList();
        }

        return selectedJobs.stream()
                .map(this::toRecommendedJob)
                .toList();
    }

    private List<Resume> filterRecentResumes(List<Resume> resumes, Instant now, int recentDays) {
        if (resumes.isEmpty()) {
            return List.of();
        }
        int days = Math.max(1, recentDays);
        Instant threshold = now.minusSeconds(days * 24L * 3600L);
        List<Resume> recentResumes = resumes.stream()
                .filter(resume -> resume.getCreatedDate() == null || !resume.getCreatedDate().isBefore(threshold))
                .toList();
        return recentResumes.isEmpty() ? resumes : recentResumes;
    }

    private Set<String> collectPreferredSkills(List<Resume> resumes, Subscriber subscriber) {
        Set<String> skills = new HashSet<>();

        for (Resume resume : resumes) {
            Job job = resume.getJob();
            if (job == null || job.getSkills() == null) {
                continue;
            }
            for (Skill skill : job.getSkills()) {
                if (skill != null && StringUtils.hasText(skill.getName())) {
                    skills.add(skill.getName().trim().toLowerCase(Locale.ROOT));
                }
            }
        }

        if (subscriber != null && subscriber.getSkills() != null) {
            for (Skill skill : subscriber.getSkills()) {
                if (skill != null && StringUtils.hasText(skill.getName())) {
                    skills.add(skill.getName().trim().toLowerCase(Locale.ROOT));
                }
            }
        }

        return skills;
    }

    private Set<String> collectPreferredKeywords(List<Resume> resumes) {
        Set<String> keywords = new HashSet<>();
        for (Resume resume : resumes) {
            Job job = resume.getJob();
            if (job == null || !StringUtils.hasText(job.getName())) {
                continue;
            }
            keywords.addAll(tokenize(job.getName()));
        }
        return keywords;
    }

    private int countSkillMatches(Job job, Set<String> preferredSkills) {
        if (preferredSkills.isEmpty() || job.getSkills() == null) {
            return 0;
        }
        int matches = 0;
        for (Skill skill : job.getSkills()) {
            if (skill != null && StringUtils.hasText(skill.getName())) {
                String normalized = skill.getName().trim().toLowerCase(Locale.ROOT);
                if (preferredSkills.contains(normalized)) {
                    matches++;
                }
            }
        }
        return matches;
    }

    private int countTitleKeywordMatches(Job job, Set<String> preferredKeywords) {
        if (preferredKeywords.isEmpty() || !StringUtils.hasText(job.getName())) {
            return 0;
        }
        Set<String> jobTokens = tokenize(job.getName());
        int matches = 0;
        for (String token : jobTokens) {
            if (preferredKeywords.contains(token)) {
                matches++;
            }
        }
        return matches;
    }

    private Set<String> tokenize(String text) {
        if (!StringUtils.hasText(text)) {
            return Set.of();
        }
        String[] tokens = text.toLowerCase(Locale.ROOT).split("[^a-z0-9+.#]+");
        Set<String> result = new HashSet<>();
        for (String token : tokens) {
            if (token.isBlank() || token.length() <= 1 || TITLE_STOP_WORDS.contains(token)) {
                continue;
            }
            result.add(token);
        }
        return result;
    }

    private RecommendedJob toRecommendedJob(Job job) {
        String companyName = job.getCompany() == null ? "Nhà tuyển dụng" : safeText(job.getCompany().getName(), "Nhà tuyển dụng");
        String salaryText = formatSalary(job.getSalary());
        String level = toLevelLabel(job.getLevel());
        String location = formatLocation(job.getLocation());
        String detailUrl = buildJobDetailUrl(job.getId());
        return new RecommendedJob(
                safeText(job.getName(), "Vị trí tuyển dụng"),
                companyName,
                salaryText,
                location,
                level,
                detailUrl
        );
    }

    private WeeklyRecommendationDispatch createDispatch(
            String email,
            String weekKey,
            String triggerSource,
            int jobCount,
            Instant now
    ) {
        WeeklyRecommendationDispatch dispatch = new WeeklyRecommendationDispatch();
        dispatch.setEmail(email);
        dispatch.setWeekKey(weekKey);
        dispatch.setTriggerSource(triggerSource);
        dispatch.setJobCount(jobCount);
        dispatch.setSentAt(now);
        return dispatch;
    }

    private Map<String, Subscriber> loadSubscribersByEmail(List<User> users) {
        List<String> emails = users.stream()
                .map(User::getEmail)
                .map(this::normalizeEmail)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (emails.isEmpty()) {
            return Map.of();
        }

        return this.subscriberRepository.findByEmailIn(emails).stream()
                .collect(Collectors.toMap(
                        subscriber -> normalizeEmail(subscriber.getEmail()),
                        subscriber -> subscriber,
                        (first, second) -> first
                ));
    }

    private Map<Long, List<Resume>> loadResumesByUser(List<User> users) {
        List<Long> userIds = users.stream()
                .map(User::getId)
                .filter(id -> id != null)
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }

        return this.resumeRepository.findByUserIdsWithJobDetails(userIds).stream()
                .filter(resume -> resume.getUser() != null && resume.getUser().getId() != null)
                .collect(Collectors.groupingBy(resume -> resume.getUser().getId()));
    }

    private String buildOpenJobsUrl() {
        String portalUrl = safeText(this.mailTemplateProperties.getPortalUrl(), "http://localhost:3000");
        if (portalUrl.endsWith("/")) {
            return portalUrl + "jobs";
        }
        return portalUrl + "/jobs";
    }

    private String buildEmailSettingsUrl() {
        String portalUrl = safeText(this.mailTemplateProperties.getPortalUrl(), "http://localhost:3000");
        if (portalUrl.endsWith("/")) {
            return portalUrl + "account";
        }
        return portalUrl + "/account";
    }

    private String buildJobDetailUrl(Long jobId) {
        if (jobId == null) {
            return buildOpenJobsUrl();
        }
        return buildOpenJobsUrl() + "/" + jobId;
    }

    private String resolveRecipientName(String name) {
        return safeText(name, "Bạn");
    }

    private String formatSalary(double salary) {
        if (salary <= 0) {
            return "Thỏa thuận";
        }
        NumberFormat formatter = NumberFormat.getNumberInstance(VIETNAMESE_LOCALE);
        formatter.setMaximumFractionDigits(0);
        formatter.setMinimumFractionDigits(0);
        return formatter.format(Math.round(salary)) + " VND/tháng";
    }

    private String toLevelLabel(LevelEnum level) {
        if (level == null) {
            return "Đang cập nhật";
        }
        return switch (level) {
            case INTERN -> "Thực tập";
            case FRESHER -> "Fresher";
            case JUNIOR -> "Junior";
            case MIDDLE -> "Middle";
            case SENIOR -> "Senior";
        };
    }

    private String formatLocation(String rawLocation) {
        String location = safeText(rawLocation, "Đang cập nhật").toUpperCase(Locale.ROOT);
        return switch (location) {
            case "HANOI", "HA NOI" -> "Hà Nội";
            case "HOCHIMINH", "HO CHI MINH", "HCM" -> "TP. Hồ Chí Minh";
            case "DANANG", "DA NANG" -> "Đà Nẵng";
            case "REMOTE" -> "Làm việc từ xa";
            default -> safeText(rawLocation, "Đang cập nhật");
        };
    }

    private String formatRecommendationWeek(ZonedDateTime now) {
        WeekFields weekFields = WeekFields.ISO;
        int year = now.get(weekFields.weekBasedYear());
        int week = now.get(weekFields.weekOfWeekBasedYear());
        return "Tuần " + week + " năm " + year;
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isValidEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        try {
            InternetAddress address = new InternetAddress(email, false);
            address.validate();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private ZoneId resolveZone(String zoneValue) {
        String zone = safeText(zoneValue, DEFAULT_ZONE.getId());
        try {
            return ZoneId.of(zone);
        } catch (Exception ex) {
            log.warn("Invalid weekly recommendation zone '{}', fallback to {}", zone, DEFAULT_ZONE);
            return DEFAULT_ZONE;
        }
    }

    private String weekKey(ZonedDateTime time) {
        WeekFields weekFields = WeekFields.ISO;
        int year = time.get(weekFields.weekBasedYear());
        int week = time.get(weekFields.weekOfWeekBasedYear());
        return year + "-W" + String.format("%02d", week);
    }

    private WeeklyRecommendationTriggerResponse skip(
            WeeklyRecommendationTriggerResponse response,
            String code,
            String message
    ) {
        response.setStatus("SKIPPED");
        response.setCode(code);
        response.setMessage(message);
        response.setEvaluatedCandidates(0);
        response.setSentCount(0);
        response.setFailedCount(0);
        response.setSkippedCount(0);
        return response;
    }

    private String safeText(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        return value.trim();
    }

    private String maskEmail(String email) {
        String normalized = normalizeEmail(email);
        int index = normalized.indexOf('@');
        if (index <= 1 || index == normalized.length() - 1) {
            return "***";
        }
        return normalized.charAt(0) + "***@" + normalized.substring(index + 1);
    }

    private record ScoredJob(Job job, int score) {
    }

    public record RecommendedJob(
            String title,
            String companyName,
            String salaryText,
            String location,
            String level,
            String detailUrl
    ) {
    }
}
