package com.eaglemotion.backend.video;

import java.time.LocalDateTime;

public class VideoResponse {

    private Long id;
    private String title;
    private String prompt;
    private String mode;
    private String model;
    private String aspectRatio;
    private Integer duration;
    private String visualStyle;
    private String status;
    private String videoUrl;
    private String thumbnailUrl;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VideoResponse(Video video) {
        this.id = video.getId();
        this.title = video.getTitle();
        this.prompt = video.getPrompt();
        this.mode = video.getMode();
        this.model = video.getModel();
        this.aspectRatio = video.getAspectRatio();
        this.duration = video.getDuration();
        this.visualStyle = video.getVisualStyle();
        this.status = video.getStatus();
        this.videoUrl = video.getVideoUrl();
        this.thumbnailUrl = video.getThumbnailUrl();
        this.errorMessage = video.getErrorMessage();
        this.createdAt = video.getCreatedAt();
        this.updatedAt = video.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getMode() {
        return mode;
    }

    public String getModel() {
        return model;
    }

    public String getAspectRatio() {
        return aspectRatio;
    }

    public Integer getDuration() {
        return duration;
    }

    public String getVisualStyle() {
        return visualStyle;
    }

    public String getStatus() {
        return status;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}