package com.eaglemotion.backend.video;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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