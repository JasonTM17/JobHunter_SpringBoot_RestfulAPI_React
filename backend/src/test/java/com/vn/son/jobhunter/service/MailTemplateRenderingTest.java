package com.vn.son.jobhunter.service;

import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class MailTemplateRenderingTest {

    @Test
    void shouldRenderTestNotificationTemplateFromResources() {
        SpringTemplateEngine templateEngine = buildTemplateEngine();
        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        context.setVariable("appName", "Jobhunter");
        context.setVariable("previewText", "Thông báo mới");
        context.setVariable("recipientName", "Ứng viên A");
        context.setVariable("title", "Thông báo từ Jobhunter");
        context.setVariable("message", "Nội dung email kiểm tra");
        context.setVariable("actionText", "Mở Jobhunter");
        context.setVariable("actionUrl", "http://localhost:3000");
        context.setVariable("supportEmail", "support@jobhunter.local");
        context.setVariable("currentYear", 2026);

        String html = templateEngine.process("mail/test-notification", context);

        assertTrue(html.contains("Jobhunter"));
        assertTrue(html.contains("Ứng viên A"));
        assertTrue(html.contains("Mở Jobhunter"));
        assertTrue(html.contains("support@jobhunter.local"));
    }

    @Test
    void shouldRenderSubscriberDigestTemplateFromResources() {
        SpringTemplateEngine templateEngine = buildTemplateEngine();
        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        context.setVariable("appName", "Jobhunter");
        context.setVariable("digestSummary", "Tổng hợp cơ hội phù hợp");
        context.setVariable("recipientName", "Ứng viên B");
        context.setVariable("digestTitle", "Việc làm mới cho bạn");
        context.setVariable("portalUrl", "http://localhost:3000");
        context.setVariable("supportEmail", "support@jobhunter.local");
        context.setVariable("currentYear", 2026);
        context.setVariable(
                "jobs",
                List.of(
                        Map.of(
                                "name", "Java Backend Developer",
                                "salary", 30000000,
                                "company", Map.of("name", "Nova Tech"),
                                "skills", List.of(
                                        Map.of("name", "Java"),
                                        Map.of("name", "Spring Boot")
                                )
                        )
                )
        );

        String html = templateEngine.process("mail/subscriber-job-digest", context);

        assertTrue(html.contains("Java Backend Developer"));
        assertTrue(html.contains("Nova Tech"));
        assertTrue(html.contains("Việc làm mới cho bạn"));
    }

    @Test
    void shouldRenderWeeklyRecommendationTemplateFromResources() {
        SpringTemplateEngine templateEngine = buildTemplateEngine();
        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        context.setVariable("appName", "Jobhunter");
        context.setVariable("previewText", "Gợi ý việc làm phù hợp trong tuần này");
        context.setVariable("recipientName", "Nguyễn Minh Anh");
        context.setVariable("summaryText", "Jobhunter đã chọn các cơ hội phù hợp hơn với hồ sơ của bạn.");
        context.setVariable("recommendationWeek", "Tuần 11 năm 2026");
        context.setVariable("openJobsUrl", "http://localhost:3000/jobs");
        context.setVariable("settingsUrl", "http://localhost:3000/account");
        context.setVariable("supportEmail", "support@jobhunter.local");
        context.setVariable("currentYear", 2026);
        context.setVariable(
                "jobs",
                List.of(
                        Map.of(
                                "title", "Senior Java Backend Developer",
                                "companyName", "Nova Tech",
                                "salaryText", "30.000.000 VND/tháng",
                                "location", "Hà Nội",
                                "level", "Senior",
                                "detailUrl", "http://localhost:3000/jobs/1"
                        )
                )
        );

        String html = templateEngine.process("mail/weekly-job-recommendation", context);

        assertTrue(html.contains("Nguyễn Minh Anh"));
        assertTrue(html.contains("Gợi ý việc làm phù hợp cho bạn tuần này"));
        assertTrue(html.contains("Senior Java Backend Developer"));
        assertTrue(html.contains("Hà Nội"));
        assertTrue(html.contains("VND/tháng"));
        assertTrue(html.contains("Cập nhật tùy chọn email"));
    }

    private SpringTemplateEngine buildTemplateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);
        return templateEngine;
    }
}
