package com.eaglemotion.backend.video;

import com.eaglemotion.backend.ai.AgnesVideoService;
import com.eaglemotion.backend.user.User;
import com.eaglemotion.backend.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VideoService {

    private static final int MIN_DURATION = 5;
    private static final int MAX_DURATION = 18;

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final AgnesVideoService agnesVideoService;

    public VideoService(
            VideoRepository videoRepository,
            UserRepository userRepository,
            AgnesVideoService agnesVideoService) {

        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.agnesVideoService = agnesVideoService;
    }

    public VideoResponse createVideo(
            VideoRequest request,
            String userEmail) {

        if (request == null) {
            throw new RuntimeException(
                    "Video request is required"
            );
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (request.getPrompt() == null ||
                request.getPrompt().trim().isEmpty()) {

            throw new RuntimeException(
                    "Video prompt is required"
            );
        }

        String mode = request.getMode();

        if (mode == null ||
                mode.trim().isEmpty()) {

            mode = "TEXT_TO_VIDEO";
        } else {
            mode = mode.trim().toUpperCase();
        }

        if (!mode.equals("TEXT_TO_VIDEO") &&
                !mode.equals("IMAGE_TO_VIDEO")) {

            throw new RuntimeException(
                    "Unsupported video generation mode: "
                            + mode
            );
        }

        /*
         * Image-to-video requires an image URL.
         * Text-to-video does not.
         */
        if (mode.equals("IMAGE_TO_VIDEO")) {

            if (request.getImageUrl() == null ||
                    request.getImageUrl().trim().isEmpty()) {

                throw new RuntimeException(
                        "An image URL is required for image-to-video generation"
                );
            }
        }

        int duration =
                request.getDuration() == null
                        ? 5
                        : request.getDuration();

        if (duration < MIN_DURATION ||
                duration > MAX_DURATION) {

            throw new RuntimeException(
                    "Video duration must be between "
                            + MIN_DURATION
                            + " and "
                            + MAX_DURATION
                            + " seconds"
            );
        }

        String aspectRatio =
                request.getAspectRatio() == null ||
                        request.getAspectRatio().trim().isEmpty()
                        ? "16:9"
                        : request.getAspectRatio().trim();

        String visualStyle =
                request.getVisualStyle() == null ||
                        request.getVisualStyle().trim().isEmpty()
                        ? "Cinematic"
                        : request.getVisualStyle().trim();

        Video video = new Video();

        video.setUser(user);

        video.setTitle(
                request.getTitle() == null ||
                        request.getTitle().trim().isEmpty()
                        ? "Untitled Video"
                        : request.getTitle().trim()
        );

        video.setPrompt(
                request.getPrompt().trim()
        );

        video.setMode(mode);

        video.setModel(
                request.getModel() == null ||
                        request.getModel().trim().isEmpty()
                        ? "Agnes Video v2.0"
                        : request.getModel().trim()
        );

        video.setAspectRatio(aspectRatio);

        video.setDuration(duration);

        video.setVisualStyle(visualStyle);

        video.setStatus("PROCESSING");

        Video savedVideo =
                videoRepository.save(video);

        try {

            String videoUrl;

            /*
             * Text-to-video
             */
            if (mode.equals("TEXT_TO_VIDEO")) {

                videoUrl =
                        agnesVideoService.generateVideo(
                                request.getPrompt().trim(),
                                duration,
                                mapAspectRatio(aspectRatio)
                        );

            /*
             * Image-to-video
             */
            } else {

                videoUrl =
                        agnesVideoService.generateVideo(
                                request.getPrompt().trim(),
                                duration,
                                mapAspectRatio(aspectRatio),
                                request.getImageUrl().trim()
                        );
            }

            if (videoUrl == null ||
                    videoUrl.trim().isEmpty()) {

                throw new RuntimeException(
                        "Agnes returned no video URL"
                );
            }

            savedVideo.setVideoUrl(
                    videoUrl
            );

            savedVideo.setStatus(
                    "COMPLETED"
            );

            savedVideo.setErrorMessage(
                    null
            );

            savedVideo =
                    videoRepository.save(savedVideo);

        } catch (Exception e) {

            savedVideo.setStatus(
                    "FAILED"
            );

            String error =
                    e.getMessage() == null ||
                            e.getMessage().trim().isEmpty()
                            ? "Video generation failed"
                            : e.getMessage();

            savedVideo.setErrorMessage(
                    error
            );

            savedVideo =
                    videoRepository.save(savedVideo);

            throw new RuntimeException(
                    "Agnes video generation failed: "
                            + error,
                    e
            );
        }

        return new VideoResponse(savedVideo);
    }

    private String mapAspectRatio(
            String aspectRatio) {

        if (aspectRatio == null) {
            return "16:9";
        }

        return switch (aspectRatio) {

            case "16:9",
                 "Landscape 16:9" ->
                    "16:9";

            case "9:16",
                 "Portrait 9:16" ->
                    "9:16";

            case "1:1",
                 "Square 1:1" ->
                    "1:1";

            case "4:5",
                 "Portrait 4:5" ->
                    "4:5";

            case "3:2",
                 "Landscape 3:2" ->
                    "3:2";

            default ->
                    "16:9";
        };
    }

    public List<VideoResponse> getUserVideos(
            String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return videoRepository
                .findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(VideoResponse::new)
                .toList();
    }

    public VideoResponse getVideo(
            Long videoId,
            String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Video video = videoRepository
                .findByIdAndUser(videoId, user)
                .orElseThrow(() ->
                        new RuntimeException("Video not found"));

        return new VideoResponse(video);
    }

    public void deleteVideo(
            Long videoId,
            String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Video video = videoRepository
                .findByIdAndUser(videoId, user)
                .orElseThrow(() ->
                        new RuntimeException("Video not found"));

        videoRepository.delete(video);
    }
}

