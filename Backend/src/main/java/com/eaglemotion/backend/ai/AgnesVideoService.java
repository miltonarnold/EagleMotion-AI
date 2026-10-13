package com.eaglemotion.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class AgnesVideoService {

    private static final String MODEL = "agnes-video-2.5-flash";
    private static final int MIN_DURATION_SECONDS = 4;
    private static final int MAX_DURATION_SECONDS = 12;
    private static final long POLL_INTERVAL_MILLIS = 5000L;
    private static final long TIMEOUT_MILLIS = 15L * 60L * 1000L;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AgnesVideoService(
            @Value("${agnes.api.url:https://apihub.agnes-ai.com}") String apiUrl,
            @Value("${agnes.api.key}") String apiKey,
            ObjectMapper objectMapper) {

        this.objectMapper = objectMapper;

        if (apiUrl == null || apiUrl.isBlank()) {
            throw new IllegalStateException(
                    "Agnes API URL is not configured");
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Agnes API key is not configured");
        }

        this.restClient = RestClient.builder()
                .baseUrl(removeTrailingSlash(apiUrl.trim()))
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public String generateVideo(
            String prompt,
            int duration,
            String aspectRatio) {

        return generateVideo(prompt, duration, aspectRatio, null);
    }

    public String generateVideo(
            String prompt,
            int duration,
            String aspectRatio,
            String imageUrl) {

        if (prompt == null || prompt.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Video prompt is required");
        }

        if (duration < MIN_DURATION_SECONDS
                || duration > MAX_DURATION_SECONDS) {

            throw new IllegalArgumentException(
                    "Agnes Video 2.5 Flash supports 4-12 seconds "
                    + "per request. Longer videos must be generated "
                    + "as multiple clips and assembled separately.");
        }

        String cleanImageUrl =
                imageUrl == null ? "" : imageUrl.trim();

        if (!cleanImageUrl.isEmpty()
                && !cleanImageUrl.startsWith("https://")
                && !cleanImageUrl.startsWith("http://")) {

            throw new IllegalArgumentException(
                    "Image-to-video requires a valid HTTP or HTTPS image URL");
        }

        String naturalPrompt = """
                IMPORTANT DIALOGUE DIRECTION:
                When characters speak, make their conversation sound like a normal real-life human conversation.
                Use a relaxed, natural speaking pace rather than speaking too quickly.
                Include brief, natural pauses between sentences and ideas.
                Characters should finish their sentences before the other character responds.
                Use natural conversational rhythm, timing, emphasis, and occasional hesitation where appropriate.
                Match facial expressions, eye contact, gestures, and body language naturally to what is being said.
                Synchronize mouth movements accurately with the spoken words.
                Do not make the dialogue sound like a rushed narration, voice-over, announcement, or synthetic reading.
                Prioritize believable human interaction and realistic conversational timing.

                SCENE:
                """ + prompt.trim();

        Map<String, Object> request = new HashMap<>();

        request.put("model", MODEL);
        request.put("prompt", naturalPrompt);
        request.put(
                "mode",
                cleanImageUrl.isEmpty() ? "text" : "img2video");
        request.put("seconds", String.valueOf(duration));
        request.put("size", "720P");
        request.put("aspect_ratio", normalizeAspectRatio(aspectRatio));
        request.put("n", 1);

        if (!cleanImageUrl.isEmpty()) {
            request.put("first_frame", cleanImageUrl);
        }

        JsonNode submitted;

        try {
            submitted = restClient.post()
                    .uri("/v1/videos")
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (Exception e) {
            throw new RuntimeException(
                    "Agnes video submission failed: "
                    + safeMessage(e), e);
        }

        if (submitted == null) {
            throw new RuntimeException(
                    "Agnes returned an empty video submission response");
        }

        String videoId = getText(submitted, "video_id");

        if (videoId == null || videoId.isBlank()) {
            videoId = getText(submitted, "id");
        }

        if (videoId == null || videoId.isBlank()) {
            String error = firstNonBlank(
                    getText(submitted, "message"),
                    getText(submitted, "error"));

            throw new RuntimeException(
                    "Agnes did not return a video_id"
                    + (error == null ? "" : ": " + error));
        }

        return pollVideo(videoId);
    }

    private String pollVideo(String videoId) {

        long deadline =
                System.currentTimeMillis() + TIMEOUT_MILLIS;

        Exception lastPollingError = null;

        while (System.currentTimeMillis() < deadline) {

            JsonNode status;

            try {
                status = restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/agnesapi")
                                .queryParam("video_id", videoId)
                                .queryParam("model_name", MODEL)
                                .build())
                        .retrieve()
                        .body(JsonNode.class);

                lastPollingError = null;

            } catch (Exception e) {
                lastPollingError = e;
                sleepBeforeNextPoll();
                continue;
            }

            if (status == null) {
                sleepBeforeNextPoll();
                continue;
            }

            String currentStatus = getText(status, "status");

            if ("completed".equalsIgnoreCase(currentStatus)
                    || "complete".equalsIgnoreCase(currentStatus)
                    || "success".equalsIgnoreCase(currentStatus)) {

                String videoUrl = firstNonBlank(
                        getText(status, "url"),
                        getText(status, "video_url"),
                        getText(status.path("metadata"), "url"),
                        getText(status.path("data"), "url"));

                if (videoUrl == null) {
                    throw new RuntimeException(
                            "Agnes completed the video but returned no video URL. "
                            + "Response: " + truncate(status.toString(), 1200));
                }

                return videoUrl;
            }

            if ("failed".equalsIgnoreCase(currentStatus)
                    || "error".equalsIgnoreCase(currentStatus)) {

                String error = firstNonBlank(
                        getText(status, "error"),
                        getText(status.path("metadata"), "error"),
                        getText(status, "message"));

                throw new RuntimeException(
                        error == null
                                ? "Agnes video generation failed"
                                : error);
            }

            sleepBeforeNextPoll();
        }

        if (lastPollingError != null) {
            throw new RuntimeException(
                    "Timed out checking Agnes video status: "
                    + safeMessage(lastPollingError),
                    lastPollingError);
        }

        throw new RuntimeException(
                "Agnes video generation timed out after 15 minutes");
    }

    private void sleepBeforeNextPoll() {
        try {
            Thread.sleep(POLL_INTERVAL_MILLIS);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Video generation was interrupted", e);
        }
    }

    private String normalizeAspectRatio(String aspectRatio) {

        if (aspectRatio == null || aspectRatio.isBlank()) {
            return "16:9";
        }

        return switch (aspectRatio.trim()) {
            case "9:16" -> "9:16";
            case "1:1" -> "1:1";
            case "4:5", "3:4" -> "3:4";
            case "3:2", "4:3" -> "4:3";
            case "21:9" -> "21:9";
            case "16:9" -> "16:9";
            default -> "16:9";
        };
    }

    private String getText(JsonNode node, String field) {

        if (node == null
                || !node.has(field)
                || node.get(field).isNull()) {
            return null;
        }

        String value = node.get(field).asText();

        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    private String firstNonBlank(String... values) {

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return null;
    }

    private String safeMessage(Exception e) {

        String message = e.getMessage();

        if (message == null || message.isBlank()) {
            return e.getClass().getSimpleName();
        }

        return truncate(message, 1000);
    }

    private String truncate(String value, int maxLength) {

        if (value == null || value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength) + "...";
    }

    private static String removeTrailingSlash(String value) {

        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }

        return value;
    }
}