package com.eaglemotion.backend.video;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
            @RequestHeader(value = "Range", required = false) String range,
            Authentication authentication) {

        String videoUrl = videoService.getVideoDownloadUrl(
                id,
                authentication.getName()
        );

        try {
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            HttpRequest.Builder requestBuilder =
                    HttpRequest.newBuilder()
                            .uri(URI.create(videoUrl))
                            .GET();

            if (range != null && !range.isBlank()) {
                requestBuilder.header("Range", range);
            }

            HttpResponse<InputStream> upstreamResponse =
                    client.send(
                            requestBuilder.build(),
                            HttpResponse.BodyHandlers.ofInputStream()
                    );

            int upstreamStatus =
                    upstreamResponse.statusCode();

            if (upstreamStatus != 200 &&
                    upstreamStatus != 206) {

                try {
                    upstreamResponse.body().close();
                } catch (Exception ignored) {
                }

                return ResponseEntity
                        .status(upstreamStatus)
                        .build();
            }

            HttpHeaders headers = new HttpHeaders();

            headers.set(
                    HttpHeaders.ACCEPT_RANGES,
                    "bytes"
            );

            headers.set(
                    HttpHeaders.CONTENT_TYPE,
                    "video/mp4"
            );

            String contentLength =
                    upstreamResponse.headers()
                            .firstValue(HttpHeaders.CONTENT_LENGTH)
                            .orElse(null);

            if (contentLength != null) {
                try {
                    headers.setContentLength(
                            Long.parseLong(contentLength)
                    );
                } catch (NumberFormatException ignored) {
                }
            }

            String contentRange =
                    upstreamResponse.headers()
                            .firstValue(HttpHeaders.CONTENT_RANGE)
                            .orElse(null);

            if (contentRange != null) {
                headers.set(
                        HttpHeaders.CONTENT_RANGE,
                        contentRange
                );
            }

            headers.set(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"EagleMotion-Video-"
                            + id
                            + ".mp4\""
            );

            StreamingResponseBody stream =
                    outputStream -> {

                        try (InputStream inputStream =
                                     upstreamResponse.body()) {

                            inputStream.transferTo(
                                    outputStream
                            );

                        } catch (Exception e) {

                            if (e instanceof InterruptedException) {
                                Thread.currentThread().interrupt();
                            }

                            throw new RuntimeException(
                                    "Video streaming was interrupted",
                                    e
                            );
                        }
                    };

            HttpStatus status =
                    upstreamStatus == 206
                            ? HttpStatus.PARTIAL_CONTENT
                            : HttpStatus.OK;

            return ResponseEntity
                    .status(status)
                    .headers(headers)
                    .body(stream);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
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