const API_BASE = "";

let allVideos = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
    initializeGeneratedVideosPage();
});

async function initializeGeneratedVideosPage() {
    setupTabs();
    setupModals();
    await loadGeneratedVideos();
}

function setupTabs() {
    const tabs = document.querySelectorAll(".video-filter");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((item) => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            currentFilter =
                tab.dataset.filter || "all";

            renderVideos();
        });
    });
}

function setupModals() {
    const closeButtons =
        document.querySelectorAll("[data-close-modal]");

    closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const modalId =
                button.dataset.closeModal;

            closeModal(modalId);
        });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.hidden = true;
            }
        });
    });
}

async function fetchVideos() {
    return await EagleMotionAuth.authenticatedFetch(
        API_BASE + "/videos"
    );
}

async function loadGeneratedVideos() {
    showLoading();

    try {
        const response = await fetchVideos();

        if (!response.ok) {
            throw new Error(
                "Failed to load generated videos (" +
                response.status +
                ")"
            );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            allVideos = data;
        } else {
            console.error(
                "Unexpected videos response:",
                data
            );

            allVideos = [];
        }

        renderVideos();
        updateCounts();
    } catch (error) {
        console.error(
            "Failed to load generated videos:",
            error
        );

        showError(
            error.message ||
            "Unable to load your generated videos."
        );
    }
}

function renderVideos() {
    hideLoading();
    const grid =
        document.getElementById("generatedVideosGrid");

    if (!grid) {
        return;
    }

    const filteredVideos =
        getFilteredVideos();

    grid.innerHTML = "";

    if (filteredVideos.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    filteredVideos.forEach((video) => {
        const card = createVideoCard(video);
        grid.appendChild(card);

        const status =
            video.status ||
            video.state ||
            "";

        const videoId =
            video.id ||
            video.videoId ||
            "";

        if (
            status.toLowerCase() === "completed" &&
            videoId
        ) {
            const previewVideo =
                card.querySelector(".video-card-preview");

            if (previewVideo) {
                loadVideoPreview(
                    previewVideo,
                    videoId
                );
            }
        }
    });
}

function getFilteredVideos() {
    if (currentFilter === "all") {
        return allVideos;
    }

    return allVideos.filter((video) => {
        const status =
            String(video.status || "")
                .toLowerCase();

        if (currentFilter === "completed") {
            return status === "completed";
        }

        if (currentFilter === "generating") {
            return (
                status === "processing" ||
                status === "pending" ||
                status === "queued" ||
                status === "in_progress"
            );
        }

        if (currentFilter === "failed") {
            return status === "failed";
        }

        return true;
    });
}

function createVideoCard(video) {
    const card =
        document.createElement("div");

    card.className = "video-card";
    card.style.cursor = "pointer";

    const status =
        String(video.status || "")
            .toLowerCase();

    const videoUrl =
        video.videoUrl ||
        video.videoURL ||
        video.url ||
        "";

    const videoId = video.id;

    const title =
        video.title ||
        video.prompt ||
        "Untitled Video";

    const createdAt =
        video.createdAt ||
        video.created_at ||
        "";

    card.innerHTML = buildVideoCardHTML(
        video,
        videoId,
        status,
        videoUrl,
        title,
        createdAt
    );

    card.addEventListener("click", () => {
        if (status === "completed" && videoUrl) {
            openVideoPlayer(video);
        }
    });

    const downloadButton =
        card.querySelector(".download-video-btn");

    if (downloadButton) {
        downloadButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                if (videoId) {
                    downloadVideo(videoId);
                }
            }
        );
    }

    const deleteButton =
        card.querySelector(".delete-video-btn");

    if (deleteButton) {
        deleteButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                if (videoId) {
                    openDeleteModal(videoId);
                }
            }
        );
    }

    const regenerateButton =
        card.querySelector(
            ".regenerate-video-btn"
        );

    if (regenerateButton) {
        regenerateButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                if (videoId) {
                    openRegenerateModal(video);
                }
            }
        );
    }

    return card;
}

function buildVideoCardHTML(
    video,
    videoId,
    status,
    videoUrl,
    title,
    createdAt
) {
    const safeTitle =
        escapeHtml(title);

    const formattedDate =
        formatDate(createdAt);

    let mediaHTML = "";

    if (status === "completed" && videoUrl) {
        mediaHTML =
            '<video class="video-card-preview" data-video-id="' +
            escapeHtml(videoId) +
            '" muted playsinline preload="none"></video>';
    } else {
        mediaHTML =
            '<div class="video-card-placeholder">' +
            getStatusLabel(status) +
            "</div>";
    }

    let actionsHTML = "";

    if (status === "completed") {
        actionsHTML =
            '<div class="video-card-actions">' +
            '<button type="button" ' +
            'class="download-video-btn">' +
            "Download" +
            "</button>" +
            '<button type="button" ' +
            'class="delete-video-btn">' +
            "Delete" +
            "</button>" +
            "</div>";
    } else if (status === "failed") {
        actionsHTML =
            '<div class="video-card-actions">' +
            '<button type="button" ' +
            'class="regenerate-video-btn">' +
            "Regenerate" +
            "</button>" +
            '<button type="button" ' +
            'class="delete-video-btn">' +
            "Delete" +
            "</button>" +
            "</div>";
    } else {
        actionsHTML =
            '<div class="video-card-actions">' +
            '<button type="button" ' +
            'class="delete-video-btn">' +
            "Delete" +
            "</button>" +
            "</div>";
    }

    return (
        '<div class="video-card-media">' +
        mediaHTML +
        "</div>" +
        '<div class="video-card-content">' +
        '<h3 class="video-card-title">' +
        safeTitle +
        "</h3>" +
        '<div class="video-card-meta">' +
        "<span>" +
        getStatusLabel(status) +
        "</span>" +
        "<span>" +
        formattedDate +
        "</span>" +
        "</div>" +
        actionsHTML +
        "</div>"
    );
}

function getStatusLabel(status) {
    if (status === "completed") {
        return "Completed";
    }

    if (
        status === "processing" ||
        status === "pending" ||
        status === "queued" ||
        status === "in_progress"
    ) {
        return "Generating";
    }

    if (status === "failed") {
        return "Failed";
    }

    return "Unknown";
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadVideoPreview(videoElement, videoId) {
    try {
        const response = await EagleMotionAuth.authenticatedFetch(
            "/videos/" + videoId + "/download"
        );

        if (!response.ok) {
            throw new Error(
                "Video preview request failed: " + response.status
            );
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        videoElement.src = objectUrl;
        videoElement.load();
        videoElement.dataset.objectUrl = objectUrl;
    } catch (error) {
        console.error(
            "Unable to load video preview:",
            error
        );
    }
}

async function downloadVideo(videoId) {
    try {
        showMessage(
            "Preparing your video download...",
            "info"
        );

        const response =
            await EagleMotionAuth.authenticatedFetch(
                API_BASE +
                "/videos/" +
                videoId +
                "/download"
            );

        if (!response.ok) {
            throw new Error(
                "Download failed (" +
                response.status +
                ")"
            );
        }

        const blob =
            await response.blob();

        if (!blob || blob.size === 0) {
            throw new Error(
                "The downloaded video is empty."
            );
        }

        const blobUrl =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = blobUrl;
        link.download =
            "EagleMotion-Video-" +
            videoId +
            ".mp4";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(blobUrl);

        showMessage(
            "Video download started.",
            "success"
        );
    } catch (error) {
        console.error(
            "Video download failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to download the video.",
            "error"
        );
    }
}

function openVideoPlayer(video) {
    const modal =
        document.getElementById(
            "videoPlayerModal"
        );

    const player =
        document.getElementById(
            "videoPlayer"
        );

    if (!modal || !player) {
        return;
    }

    const videoUrl =
        video.videoUrl ||
        video.videoURL ||
        video.url ||
        "";

    if (!videoUrl) {
        showMessage(
            "No video URL is available.",
            "error"
        );
        return;
    }

    player.src = videoUrl;
    player.load();

    modal.hidden = false;
}

function openDeleteModal(videoId) {
    const modal =
        document.getElementById(
            "deleteModal"
        );

    if (!modal) {
        return;
    }

    modal.dataset.videoId =
        String(videoId);

    modal.hidden = false;

    const confirmButton =
        modal.querySelector(
            ".confirm-delete-btn"
        );

    if (confirmButton) {
        confirmButton.onclick = async () => {
            await deleteVideo(videoId);
        };
    }
}

async function deleteVideo(videoId) {
    try {
        const response =
            await EagleMotionAuth.authenticatedFetch(
                API_BASE +
                "/videos/" +
                videoId,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Delete failed (" +
                response.status +
                ")"
            );
        }

        allVideos =
            allVideos.filter(
                (video) =>
                    String(video.id) !==
                    String(videoId)
            );

        closeModal("deleteModal");

        renderVideos();
        updateCounts();

        showMessage(
            "Video deleted successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Delete failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete the video.",
            "error"
        );
    }
}

function openRegenerateModal(video) {
    const modal =
        document.getElementById(
            "regenerateModal"
        );

    if (!modal) {
        regenerateVideo(video);
        return;
    }

    modal.dataset.videoId =
        String(video.id);

    modal.hidden = false;

    const confirmButton =
        modal.querySelector(
            ".confirm-regenerate-btn"
        );

    if (confirmButton) {
        confirmButton.onclick = async () => {
            await regenerateVideo(video);
        };
    }
}

async function regenerateVideo(video) {
    closeModal("regenerateModal");

    const prompt =
        video.prompt ||
        "";

    if (!prompt) {
        showMessage(
            "The failed video does not contain a prompt for regeneration.",
            "error"
        );
        return;
    }

    showMessage(
        "Regeneration is being started...",
        "info"
    );

    try {
        const requestBody = {
            prompt: prompt
        };

        if (video.duration != null) {
            requestBody.duration =
                video.duration;
        }

        if (video.aspectRatio) {
            requestBody.aspectRatio =
                video.aspectRatio;
        }

        if (video.style) {
            requestBody.style =
                video.style;
        }

        if (video.mode) {
            requestBody.mode =
                video.mode;
        }

        if (video.imageUrl) {
            requestBody.imageUrl =
                video.imageUrl;
        }

        const response =
            await EagleMotionAuth.authenticatedFetch(
                API_BASE +
                "/videos/generate",
                {
                    method: "POST",
                    body: JSON.stringify(
                        requestBody
                    )
                }
            );

        if (!response.ok) {
            const errorText =
                await response.text();

            throw new Error(
                "Regeneration failed (" +
                response.status +
                "): " +
                errorText
            );
        }

        showMessage(
            "Video regeneration started successfully.",
            "success"
        );

        await loadGeneratedVideos();
    } catch (error) {
        console.error(
            "Regeneration failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to regenerate the video.",
            "error"
        );
    }
}

function updateCounts() {
    const allCount =
        document.getElementById(
            "allCount"
        );

    const completedCount =
        document.getElementById(
            "completedCount"
        );

    const generatingCount =
        document.getElementById(
            "generatingCount"
        );

    const failedCount =
        document.getElementById(
            "failedCount"
        );

    const completed =
        allVideos.filter(
            (video) =>
                String(video.status || "")
                    .toLowerCase() ===
                "completed"
        ).length;

    const generating =
        allVideos.filter((video) => {
            const status =
                String(video.status || "")
                    .toLowerCase();

            return (
                status === "processing" ||
                status === "pending" ||
                status === "queued" ||
                status === "in_progress"
            );
        }).length;

    const failed =
        allVideos.filter(
            (video) =>
                String(video.status || "")
                    .toLowerCase() ===
                "failed"
        ).length;

    if (allCount) {
        allCount.textContent =
            allVideos.length;
    }

    if (completedCount) {
        completedCount.textContent =
            completed;
    }

    if (generatingCount) {
        generatingCount.textContent =
            generating;
    }

    if (failedCount) {
        failedCount.textContent =
            failed;
    }
}

function showLoading() {
    const loading = document.getElementById("videosLoading");
    const grid = document.getElementById("generatedVideosGrid");

    if (loading) loading.hidden = false;
    if (grid) grid.hidden = true;

    hideEmptyState();
}

function hideLoading() {
    const loading = document.getElementById("videosLoading");
    const grid = document.getElementById("generatedVideosGrid");

    if (loading) loading.hidden = true;
    if (grid) grid.hidden = false;
}

function showEmptyState() {
    hideLoading();
    const empty = document.getElementById("videosEmpty");
    const grid = document.getElementById("generatedVideosGrid");

    if (empty) empty.hidden = false;
    if (grid) grid.hidden = true;
}

function hideEmptyState() {
    const empty = document.getElementById("videosEmpty");
    if (empty) empty.hidden = true;
}

function showError(message) {
    hideLoading();

    const grid =
        document.getElementById(
            "generatedVideosGrid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML =
        '<div class="video-error-state">' +
        "<p>" +
        escapeHtml(message) +
        "</p>" +
        '<button type="button" id="retryVideosBtn">' +
        "Try Again" +
        "</button>" +
        "</div>";

    grid.style.display = "";

    const retryButton =
        document.getElementById(
            "retryVideosBtn"
        );

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            () => {
                loadGeneratedVideos();
            }
        );
    }
}

function showMessage(message, type) {
    let container =
        document.getElementById(
            "videoMessage"
        );

    if (!container) {
        container =
            document.createElement("div");

        container.id =
            "videoMessage";

        document.body.appendChild(
            container
        );
    }

    container.className =
        "video-message " +
        (type || "info");

    container.textContent =
        message;

    container.style.display = "block";

    window.clearTimeout(
        container._timeout
    );

    container._timeout =
        window.setTimeout(() => {
            container.style.display =
                "none";
        }, 4000);
}

function closeModal(modalId) {
    const modal =
        document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.hidden = true;

    const player =
        modal.querySelector("video");

    if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
    }
}
