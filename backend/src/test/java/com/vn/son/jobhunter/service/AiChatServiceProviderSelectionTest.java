package com.vn.son.jobhunter.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatServiceProviderSelectionTest {

    @Test
    void shouldPreferOpenAiCompatibleFlowWhenGeminiEndpointUsesOpenAiModel() {
        AiChatService service = new AiChatService();

        ReflectionTestUtils.setField(service, "aiProvider", "auto");
        ReflectionTestUtils.setField(service, "openAiApiKey", "AIza-test-key");
        ReflectionTestUtils.setField(service, "legacyOpenAiApiKey", "");
        ReflectionTestUtils.setField(
                service,
                "openAiBaseUrl",
                "https://generativelanguage.googleapis.com/v1beta/openai"
        );
        ReflectionTestUtils.setField(service, "openAiModel", "gemini-2.5-flash");
        ReflectionTestUtils.setField(service, "geminiApiKey", "");
        ReflectionTestUtils.setField(service, "geminiModel", "");

        assertTrue(service.isAvailable());
    }

    @Test
    void shouldFallbackToGeminiNativeFlowWhenApiKeyLooksLikeGeminiAndOpenAiBaseUrlIsDefault() {
        AiChatService service = new AiChatService();

        ReflectionTestUtils.setField(service, "aiProvider", "auto");
        ReflectionTestUtils.setField(service, "openAiApiKey", "AIza-test-key");
        ReflectionTestUtils.setField(service, "legacyOpenAiApiKey", "");
        ReflectionTestUtils.setField(service, "openAiBaseUrl", "https://api.openai.com/v1");
        ReflectionTestUtils.setField(service, "openAiModel", "");
        ReflectionTestUtils.setField(service, "geminiApiKey", "");
        ReflectionTestUtils.setField(service, "geminiModel", "gemini-2.5-flash");

        assertTrue(service.isAvailable());
    }

    @Test
    void shouldReturnUnavailableWhenNoValidProviderConfigPresent() {
        AiChatService service = new AiChatService();

        ReflectionTestUtils.setField(service, "aiProvider", "auto");
        ReflectionTestUtils.setField(service, "openAiApiKey", "");
        ReflectionTestUtils.setField(service, "legacyOpenAiApiKey", "");
        ReflectionTestUtils.setField(service, "geminiApiKey", "");
        ReflectionTestUtils.setField(service, "openAiModel", "");
        ReflectionTestUtils.setField(service, "geminiModel", "");

        assertFalse(service.isAvailable());
    }
}
