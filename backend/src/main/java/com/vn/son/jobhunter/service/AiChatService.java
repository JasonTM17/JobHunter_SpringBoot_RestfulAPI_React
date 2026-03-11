package com.vn.son.jobhunter.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn.son.jobhunter.domain.dto.AiChatRequest;
import com.vn.son.jobhunter.domain.res.ai.AiChatResponse;
import com.vn.son.jobhunter.util.error.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class AiChatService {
    private static final String DEFAULT_SYSTEM_PROMPT =
            "You are JobHunter Assistant. Give concise, practical answers about jobs, CVs, interviews and career growth.";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    @Value("${openai.base-url}")
    private String openAiBaseUrl;

    @Value("${openai.model}")
    private String openAiModel;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    public AiChatResponse generateReply(AiChatRequest request) throws BadRequestException {
        if (!StringUtils.hasText(openAiApiKey)) {
            throw new BadRequestException("OPENAI_API_KEY is not configured on backend");
        }

        String message = request.getMessage().trim();
        String systemPrompt = StringUtils.hasText(request.getSystemPrompt())
                ? request.getSystemPrompt().trim()
                : DEFAULT_SYSTEM_PROMPT;

        String rawResponse = callOpenAi(message, systemPrompt);
        String reply = extractReply(rawResponse);
        return new AiChatResponse(reply, openAiModel);
    }

    private String callOpenAi(String message, String systemPrompt) throws BadRequestException {
        String normalizedBaseUrl = openAiBaseUrl.endsWith("/")
                ? openAiBaseUrl.substring(0, openAiBaseUrl.length() - 1)
                : openAiBaseUrl;

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", openAiModel);
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
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new BadRequestException(extractOpenAiError(response.body(), response.statusCode()));
            }
            return response.body();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("OpenAI request was interrupted", ex);
        } catch (IOException ex) {
            throw new BadRequestException("Cannot connect to OpenAI API", ex);
        }
    }

    private String extractReply(String responseBody) throws BadRequestException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            String reply = "";

            if (contentNode.isTextual()) {
                reply = contentNode.asText();
            } else if (contentNode.isArray()) {
                StringBuilder builder = new StringBuilder();
                for (JsonNode node : contentNode) {
                    if (node.isTextual()) {
                        builder.append(node.asText());
                    } else if (node.has("text")) {
                        builder.append(node.path("text").asText(""));
                    }
                }
                reply = builder.toString();
            }

            if (!StringUtils.hasText(reply)) {
                throw new BadRequestException("OpenAI returned an empty response");
            }
            return reply.trim();
        } catch (IOException ex) {
            throw new BadRequestException("Invalid response from OpenAI API", ex);
        }
    }

    private String extractOpenAiError(String body, int statusCode) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText("");
            if (StringUtils.hasText(message)) {
                return "OpenAI API error (" + statusCode + "): " + message;
            }
        } catch (Exception ignored) {
        }
        return "OpenAI API error with status: " + statusCode;
    }
}
