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

    private static final String MODEL = "agnes-video-v2.0";
    private static final int FRAME_RATE = 24;
    private static final int MAX_FRAMES = 441;
    private static final int MIN_DURATION = 5;
    private static final int MAX_DURATION = 240;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AgnesVideoService(
            @Value("${agnes.api.url}") String apiUrl,
            @Value("${agnes.api.key}") String apiKey,
            ObjectMapper objectMapper) {

        this.objectMapper = objectMapper;

        if (apiUrl == null || apiUrl.isBlank()) {
            throw new IllegalStateException("Agnes API URL is not configured");
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Agnes API key is not configured");
        }

        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(
                        "Authorization",
                        "Bearer " + apiKey
                )
                .defaultHeader(
                        "Content-Type",
                        "application/json"
                )
                .build();
    }

    /**
     * Generates a video using Agnes Video v2.0.
     *
     * Agnes v2.0 supports a maximum of 441 frames per request.
     * At 24 FPS this is approximately 18.4 seconds.
     *
     * The duration validation here allows EagleMotion to accept
     * requests up to 240 seconds. Long-video assembly will be
     * handled separately using FFmpeg.
     */
    public String generateVideo(
            String prompt,
            int duration,
            String aspectRatio) {

        return generateVideo(
                prompt,
                duration,
                aspectRatio,
                null
        );
    }

    /**
     * Text-to-video or image-to-video generation.
     *
     * imageUrl may be null for text-to-video.
     */
    public String generateVideo(
            String prompt,
            int duration,
            String aspectRatio,
            String imageUrl) {

        if (prompt == null || prompt.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Video prompt is required"
            );
        }

        if (duration < MIN_DURATION || duration > MAX_DURATION) {
            throw new IllegalArgumentException(
                    "Video duration must be between "
                            + MIN_DURATION
                            + " and "
                            + MAX_DURATION
                            + " seconds"
            );
        }

        if (imageUrl != null && !imageUrl.trim().isEmpty()
                && !imageUrl.startsWith("http://")
                && !imageUrl.startsWith("https://")) {

            throw new IllegalArgumentException(
                    "Image-to-video requires a valid HTTP or HTTPS image URL"
            );
        }

        int requestedFrames = durationToFrames(duration);

        Map<String, Object> request = new HashMap<>();

        request.put("model", MODEL);
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

request.put("prompt", naturalPrompt);

        int[] dimensions = getDimensions(aspectRatio);

        request.put("width", dimensions[0]);
        request.put("height", dimensions[1]);

        request.put("num_frames", requestedFrames);
        request.put("frame_rate", FRAME_RATE);

        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            request.put("image", imageUrl.trim());
        }

        JsonNode submitted = restClient
                .post()
                .uri("/v1/videos")
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        if (submitted == null) {
            throw new RuntimeException(
                    "Agnes returned an empty response"
            );
        }

        String taskId = getText(
                submitted,
                "task_id"
        );

        String videoId = getText(
                submitted,
                "video_id"
        );

        if ((taskId == null || taskId.isBlank())
                && (videoId == null || videoId.isBlank())) {

            throw new RuntimeException(
                    "Agnes did not return a task ID or video ID"
            );
        }

        return pollVideo(
                taskId,
                videoId
        );
    }

    private String pollVideo(
            String taskId,
            String videoId) {

        long timeout =
                System.currentTimeMillis()
                        + (15L * 60L * 1000L);

        while (System.currentTimeMillis() < timeout) {

            JsonNode status;

            if (videoId != null && !videoId.isBlank()) {

                status = restClient
                        .get()
                        .uri(uriBuilder ->
                                uriBuilder
                                        .path("/agnesapi")
                                        .queryParam(
                                                "video_id",
                                                videoId
                                        )
                                        .queryParam(
                                                "model_name",
                                                MODEL
                                        )
                                        .build())
                        .retrieve()
                        .body(JsonNode.class);

            } else {

                status = restClient
                        .get()
                        .uri(
                                "/v1/videos/"
                                        + taskId
                        )
                        .retrieve()
                        .body(JsonNode.class);
            }

            if (status == null) {
                throw new RuntimeException(
                        "Agnes returned an empty status response"
                );
            }

            String currentStatus =
                    getText(status, "status");

            if ("completed".equalsIgnoreCase(currentStatus)) {

                String videoUrl =
                        getText(status, "url");

                if (videoUrl == null
                        || videoUrl.isBlank()) {

                    throw new RuntimeException(
                            "Agnes completed the video "
                                    + "but returned no video URL"
                    );
                }

                return videoUrl;
            }

            if ("failed".equalsIgnoreCase(currentStatus)
                    || "error".equalsIgnoreCase(currentStatus)) {

                String error =
                        getText(status, "error");

                if (error == null || error.isBlank()) {
                    error =
                            "Agnes video generation failed";
                }

                throw new RuntimeException(error);
            }

            try {
                

                Thread.sleep(10000);

            } catch (InterruptedException e) {

                Thread.currentThread().interrupt();

                throw new RuntimeException(
                        "Video generation was interrupted",
                        e
                );
            }
        }

        throw new RuntimeException(
                "Agnes video generation timed out"
        );
    }

    private int durationToFrames(int duration) {

        /*
         * Agnes requires:
         *
         * num_frames = 8n + 1
         *
         * and a maximum of 441 frames.
         *
         * For a single Agnes request we therefore cap the
         * actual generated clip at the maximum supported size.
         *
         * Long videos will be assembled separately.
         */

        int requestedFrames =
                Math.round(
                        duration * FRAME_RATE
                );

        requestedFrames =
                Math.min(
                        requestedFrames,
                        MAX_FRAMES
                );

        int frames =
                ((requestedFrames - 1) / 8) * 8 + 1;

        if (frames < 9) {
            frames = 9;
        }

        return Math.min(
                frames,
                MAX_FRAMES
        );
    }

    private int[] getDimensions(
            String aspectRatio) {

        if (aspectRatio == null) {
            return new int[]{1152, 768};
        }

        return switch (aspectRatio) {

            case "9:16" ->
                    new int[]{768, 1152};

            case "1:1" ->
                    new int[]{832, 832};

            case "4:5" ->
                    new int[]{832, 1040};

            case "3:2" ->
                    new int[]{1152, 768};

            default ->
                    new int[]{1152, 768};
        };
    }

    private String getText(
            JsonNode node,
            String field) {

        if (node == null
                || !node.has(field)
                || node.get(field).isNull()) {

            return null;
        }

        String value =
                node.get(field).asText();

        return value == null
                ? null
                : value.trim();
    }
}

