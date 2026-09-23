package com.eaglemotion.backend.video;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@RestController
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PostMapping("/generate")
    public ResponseEntity<VideoResponse> generateVideo(
            @RequestBody VideoRequest request,
            Authentication authentication) {

        VideoResponse response = videoService.createVideo(
                request,
                authentication.getName()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<VideoResponse>> getVideos(
            Authentication authentication) {

        return ResponseEntity.ok(
                videoService.getUserVideos(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> getVideo(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                videoService.getVideo(
                        id,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<StreamingResponseBody> downloadVideo(
            @PathVariable Long id,
            Authentication authentication) {

        String videoUrl = videoService.getVideoDownloadUrl(
                id,
                authentication.getName()
        );

        StreamingResponseBody stream = outputStream -> {

            HttpClient client = HttpClient.newHttpClient();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(videoUrl))
                    .GET()
                    .build();

            try {

                HttpResponse<InputStream> response = client.send(
                        request,
                        HttpResponse.BodyHandlers.ofInputStream()
                );

                if (response.statusCode() < 200 ||
                        response.statusCode() >= 300) {

                    throw new RuntimeException(
                            "Unable to download video"
                    );
                }

                try (InputStream inputStream = response.body()) {
                    inputStream.transferTo(outputStream);
                }

            } catch (InterruptedException e) {

                Thread.currentThread().interrupt();

                throw new RuntimeException(
                        "Video download was interrupted",
                        e
                );
            }
        };

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType("video/mp4")
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"EagleMotion-Video-"
                                + id
                                + ".mp4\""
                )
                .body(stream);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(
            @PathVariable Long id,
            Authentication authentication) {

        videoService.deleteVideo(
                id,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}