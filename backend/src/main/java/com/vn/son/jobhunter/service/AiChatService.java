package com.vn.son.jobhunter.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn.son.jobhunter.domain.dto.AiChatRequest;
import com.vn.son.jobhunter.domain.res.ai.AiChatResponse;
import com.vn.son.jobhunter.util.error.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;

@Service
public class AiChatService {
    private static final Logger logger = LoggerFactory.getLogger(AiChatService.class);

    private static final String AI_NOT_CONFIGURED_CODE = "AI_NOT_CONFIGURED";
    private static final String AI_PROVIDER_ERROR_CODE = "AI_PROVIDER_ERROR";
    private static final String AI_NOT_CONFIGURED_MESSAGE =
            "T\u00ednh n\u0103ng AI hi\u1ec7n ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh tr\u00ean m\u00e1y ch\u1ee7. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";
    private static final String AI_PROVIDER_ERROR_MESSAGE =
            "D\u1ecbch v\u1ee5 AI \u0111ang t\u1ea1m gi\u00e1n \u0111o\u1ea1n. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";
    private static final String AI_EMPTY_RESPONSE_MESSAGE =
            "AI ch\u01b0a th\u1ec3 ph\u1ea3n h\u1ed3i v\u00e0o l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";

    private static final String DEFAULT_SYSTEM_PROMPT =
            "You are JobHunter Assistant. Give concise, practical answers about jobs, CVs, interviews and career growth.";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    @Value("${openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${openai.model:gpt-4.1-mini}")
    private String openAiModel;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.api.legacy-key:}")
    private String legacyOpenAiApiKey;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${ai.provider:auto}")
    private String aiProvider;

    public boolean isAvailable() {
        return resolveProviderConfig().isAvailable();
    }

    public String unavailableMessage() {
        return AI_NOT_CONFIGURED_MESSAGE;
    }

    public AiChatResponse generateReply(AiChatRequest request) throws AiServiceException {
        ProviderConfig providerConfig = resolveProviderConfig();
        if (!providerConfig.isAvailable()) {
            throw new AiServiceException(AI_NOT_CONFIGURED_CODE, AI_NOT_CONFIGURED_MESSAGE);
        }

        String message = request.getMessage().trim();
        String systemPrompt = StringUtils.hasText(request.getSystemPrompt())
                ? request.getSystemPrompt().trim()
                : DEFAULT_SYSTEM_PROMPT;

        String rawResponse;
        if (providerConfig.provider == AiProvider.GEMINI) {
            rawResponse = callGemini(providerConfig, message, systemPrompt);
        } else {
            rawResponse = callOpenAi(providerConfig, message, systemPrompt);
        }

        String reply = extractReply(providerConfig.provider, rawResponse);
        return new AiChatResponse(reply, providerConfig.model);
    }

    private String callOpenAi(ProviderConfig providerConfig, String message, String systemPrompt) throws AiServiceException {
        String normalizedBaseUrl = trimTrailingSlash(openAiBaseUrl);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", providerConfig.model);
        payload.put("temperature", 0.4);

        ArrayNode messages = payload.putArray("messages");
        ObjectNode systemNode = messages.addObject();
        systemNode.put("role", "system");
        systemNode.put("content", systemPrompt);

        ObjectNode userNode = messages.addObject();
        userNode.put("role", "user");
        userNode.put("content", message);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(normalizedBaseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(45))
                .header("Authorization", "Bearer " + providerConfig.apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                String providerError = extractProviderError(response.body(), response.statusCode());
                logger.warn("AI provider OPENAI request failed status={}", response.statusCode());
                logger.debug("AI provider OPENAI error detail: {}", providerError);
                throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE);
            }
            return response.body();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE, ex);
        } catch (IOException ex) {
            throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE, ex);
        }
    }

    private String callGemini(ProviderConfig providerConfig, String message, String systemPrompt) throws AiServiceException {
        String normalizedBaseUrl = trimTrailingSlash(geminiBaseUrl);
        String encodedModel = URLEncoder.encode(providerConfig.model, StandardCharsets.UTF_8);
        String encodedKey = URLEncoder.encode(providerConfig.apiKey, StandardCharsets.UTF_8);

        ObjectNode payload = objectMapper.createObjectNode();
        ObjectNode systemInstruction = payload.putObject("systemInstruction");
        ArrayNode systemParts = systemInstruction.putArray("parts");
        systemParts.addObject().put("text", systemPrompt);

        ArrayNode contents = payload.putArray("contents");
        ObjectNode userContent = contents.addObject();
        userContent.put("role", "user");
        ArrayNode userParts = userContent.putArray("parts");
        userParts.addObject().put("text", message);

        ObjectNode generationConfig = payload.putObject("generationConfig");
        generationConfig.put("temperature", 0.4);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(normalizedBaseUrl + "/models/" + encodedModel + ":generateContent?key=" + encodedKey))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                String providerError = extractProviderError(response.body(), response.statusCode());
                logger.warn("AI provider GEMINI request failed status={}", response.statusCode());
                logger.debug("AI provider GEMINI error detail: {}", providerError);
                throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE);
            }
            return response.body();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE, ex);
        } catch (IOException ex) {
            throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE, ex);
        }
    }

    private String extractReply(AiProvider provider, String responseBody) throws AiServiceException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String reply;

            if (provider == AiProvider.GEMINI) {
                reply = extractGeminiReply(root);
            } else {
                reply = extractOpenAiReply(root);
            }

            if (!StringUtils.hasText(reply)) {
                throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_EMPTY_RESPONSE_MESSAGE);
            }
            return reply.trim();
        } catch (IOException ex) {
            throw new AiServiceException(AI_PROVIDER_ERROR_CODE, AI_PROVIDER_ERROR_MESSAGE, ex);
        }
    }

    private String extractOpenAiReply(JsonNode root) {
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        if (contentNode.isTextual()) {
            return contentNode.asText();
        }
        if (contentNode.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode node : contentNode) {
                if (node.isTextual()) {
                    builder.append(node.asText());
                } else if (node.has("text")) {
                    builder.append(node.path("text").asText(""));
                }
            }
            return builder.toString();
        }
        return "";
    }

    private String extractGeminiReply(JsonNode root) {
        JsonNode partsNode = root.path("candidates").path(0).path("content").path("parts");
        if (!partsNode.isArray()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (JsonNode node : partsNode) {
            if (node.isTextual()) {
                builder.append(node.asText());
            } else if (node.has("text")) {
                builder.append(node.path("text").asText(""));
            }
        }
        return builder.toString();
    }

    private String extractProviderError(String body, int statusCode) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText("");
            if (StringUtils.hasText(message)) {
                return "AI provider error (" + statusCode + "): " + message;
            }
        } catch (Exception ignored) {
        }
        return "AI provider error with status: " + statusCode;
    }

    private ProviderConfig resolveProviderConfig() {
        String provider = StringUtils.hasText(aiProvider) ? aiProvider.trim().toLowerCase(Locale.ROOT) : "auto";
        String openAiKey = resolveOpenAiKey();
        String geminiKey = resolveGeminiKey(openAiKey);
        boolean openAiCompatibleGemini = isOpenAiCompatibleGeminiBaseUrlConfigured();

        if ("openai".equals(provider)) {
            return buildOpenAiConfig(openAiKey);
        }
        if ("gemini".equals(provider)) {
            return buildGeminiConfig(geminiKey);
        }
        if (!"auto".equals(provider)) {
            logger.warn("Unknown ai.provider '{}', fallback to auto", aiProvider);
        }

        if (StringUtils.hasText(openAiKey)
                && (!looksLikeGeminiApiKey(openAiKey) || openAiCompatibleGemini)) {
            return buildOpenAiConfig(openAiKey);
        }
        if (StringUtils.hasText(geminiKey)) {
            return buildGeminiConfig(geminiKey);
        }
        if (StringUtils.hasText(openAiKey)) {
            return buildOpenAiConfig(openAiKey);
        }
        return ProviderConfig.unavailable();
    }

    private ProviderConfig buildOpenAiConfig(String key) {
        String model = StringUtils.hasText(openAiModel) ? openAiModel.trim() : "";
        if (!StringUtils.hasText(key) || !StringUtils.hasText(model)) {
            return ProviderConfig.unavailable();
        }
        return new ProviderConfig(AiProvider.OPENAI, key, model);
    }

    private ProviderConfig buildGeminiConfig(String key) {
        String model = StringUtils.hasText(geminiModel) ? geminiModel.trim() : "";
        if (!StringUtils.hasText(key) || !StringUtils.hasText(model)) {
            return ProviderConfig.unavailable();
        }
        return new ProviderConfig(AiProvider.GEMINI, key, model);
    }

    private String resolveOpenAiKey() {
        if (StringUtils.hasText(openAiApiKey)) {
            return openAiApiKey.trim();
        }
        if (StringUtils.hasText(legacyOpenAiApiKey)) {
            return legacyOpenAiApiKey.trim();
        }
        return "";
    }

    private String resolveGeminiKey(String openAiKey) {
        if (StringUtils.hasText(geminiApiKey)) {
            return geminiApiKey.trim();
        }
        if (looksLikeGeminiApiKey(openAiKey)) {
            return openAiKey.trim();
        }
        return "";
    }

    private boolean looksLikeGeminiApiKey(String key) {
        return StringUtils.hasText(key) && key.trim().startsWith("AIza");
    }

    private boolean isOpenAiCompatibleGeminiBaseUrlConfigured() {
        if (!StringUtils.hasText(openAiBaseUrl)) {
            return false;
        }
        String normalized = openAiBaseUrl.trim().toLowerCase(Locale.ROOT);
        return normalized.contains("generativelanguage.googleapis.com") && normalized.contains("/openai");
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private enum AiProvider {
        OPENAI,
        GEMINI,
        NONE
    }

    private static final class ProviderConfig {
        private final AiProvider provider;
        private final String apiKey;
        private final String model;

        private ProviderConfig(AiProvider provider, String apiKey, String model) {
            this.provider = provider;
            this.apiKey = apiKey;
            this.model = model;
        }

        private boolean isAvailable() {
            return this.provider != AiProvider.NONE
                    && StringUtils.hasText(this.apiKey)
                    && StringUtils.hasText(this.model);
        }

        private static ProviderConfig unavailable() {
            return new ProviderConfig(AiProvider.NONE, "", "");
        }
    }
}
