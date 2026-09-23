const API_BASE = "";

let allVideos = [];
let currentFilter = "all";
let videoToDelete = null;
let videoToRegenerate = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeGeneratedVideos();
});

async function initializeGeneratedVideos() {
    setupTabs();
    setupModals();
    await loadGeneratedVideos();
}

function setupTabs() {
    const tabs = document.querySelectorAll(".video-tab");

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
    const deleteCancel =
        document.getElementById("cancelDelete");

    const deleteConfirm =
        document.getElementById("confirmDelete");

    const regenerateCancel =
        document.getElementById("cancelRegenerate");

    const regenerateConfirm =
        document.getElementById("confirmRegenerate");

    const playerClose =
        document.getElementById("closeVideoPlayer");

    if (deleteCancel) {
        deleteCancel.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    if (deleteConfirm) {
        deleteConfirm.addEventListener(
            "click",
            confirmDeleteVideo
        );
    }

    if (regenerateCancel) {
        regenerateCancel.addEventListener(
            "click",
            closeRegenerateModal
        );
    }

    if (regenerateConfirm) {
        regenerateConfirm.addEventListener(
            "click",
            confirmRegenerateVideo
        );
    }

    if (playerClose) {
        playerClose.addEventListener(
            "click",
            closeVideoPlayer
        );
    }

    const deleteModal =
        document.getElementById("deleteModal");

    const regenerateModal =
        document.getElementById("regenerateModal");

    const playerModal =
        document.getElementById("videoPlayerModal");

    [deleteModal, regenerateModal, playerModal]
        .forEach((modal) => {
            if (modal) {
                modal.addEventListener(
                    "click",
                    (event) => {
                        if (
                            event.target === modal
                        ) {
                            modal.classList.remove(
                                "active"
                            );
                        }
                    }
                );
            }
        });
}

async function loadGeneratedVideos() {
    showLoading();

    try {
        const response =
            await EagleMotionAuth.authenticatedFetch(
                `${API_BASE}/videos`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load generated videos"
            );
        }

        allVideos = await response.json();

        renderVideos();

        startProcessingRefresh();

    } catch (error) {
        console.error(error);
        showError(
            "Unable to load your generated videos."
        );
    }
}

function renderVideos() {
    const grid =
        document.getElementById(
            "generatedVideosGrid"
        );

    const loading =
        document.getElementById(
            "videosLoading"
        );

    const empty =
        document.getElementById(
            "videosEmpty"
        );

    if (!grid) {
        return;
    }

    if (loading) {
        loading.style.display = "none";
    }

    let videos = [...allVideos];

    if (currentFilter === "completed") {
        videos = videos.filter(
            (video) =>
                video.status === "COMPLETED"
        );
    }

    if (currentFilter === "generating") {
        videos = videos.filter(
            (video) =>
                video.status === "PROCESSING" ||
                video.status === "PENDING"
        );
    }

    if (currentFilter === "failed") {
        videos = videos.filter(
            (video) =>
                video.status === "FAILED"
        );
    }

    grid.innerHTML = "";

    if (videos.length === 0) {
        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    videos.forEach((video) => {
        grid.appendChild(
            createVideoCard(video)
        );
    });
}

function createVideoCard(video) {
    const card =
        document.createElement("div");

    card.className =
        "generated-video-card";

    const status =
        (video.status || "PROCESSING")
            .toUpperCase();

    const title =
        escapeHtml(
            video.title ||
            "Untitled Video"
        );

    const prompt =
        escapeHtml(
            video.prompt || ""
        );

    const created =
        formatDate(video.createdAt);

    let preview = "";

    if (
        status === "COMPLETED" &&
        video.videoUrl
    ) {
        preview = `
            <div class="video-card-preview">
                <video
                    src="${escapeAttribute(
                        video.videoUrl
                    )}"
                    preload="metadata"
                    muted
                ></video>

                <div class="video-play-overlay">
                    Gû¦
                </div>
            </div>
        `;
    } else if (video.thumbnailUrl) {
        preview = `
            <div class="video-card-preview">
                <img
                    src="${escapeAttribute(
                        video.thumbnailUrl
                    )}"
                    alt="${title}"
                >
            </div>
        `;
    } else {
        preview = `
            <div class="video-card-preview video-placeholder">
                <div>
                    ${getStatusIcon(status)}
                </div>
            </div>
        `;
    }

    let actions = "";

    if (status === "COMPLETED") {
        actions = `
            <button
                class="video-action-btn"
                onclick="playVideo(${video.id})"
            >
                Play
            </button>

            <button
                class="video-action-btn"
                onclick="downloadVideo(${video.id})"
            >
                Download
            </button>

            <button
                class="video-action-btn danger"
                onclick="openDeleteModal(${video.id})"
            >
                Delete
            </button>
        `;
    } else if (
        status === "PROCESSING" ||
        status === "PENDING"
    ) {
        actions = `
            <div class="video-processing-message">
                Your video is being generated...
            </div>

            <button
                class="video-action-btn danger"
                onclick="openDeleteModal(${video.id})"
            >
                Delete
            </button>
        `;
    } else if (status === "FAILED") {
        actions = `
            <button
                class="video-action-btn"
                onclick="openRegenerateModal(${video.id})"
            >
                Regenerate
            </button>

            <button
                class="video-action-btn danger"
                onclick="openDeleteModal(${video.id})"
            >
                Delete
            </button>
        `;
    }

    card.innerHTML = `
        ${preview}

        <div class="video-card-content">

            <div class="video-card-header">
                <h3>${title}</h3>

                <span class="
                    video-status
                    status-${status.toLowerCase()}
                ">
                    ${formatStatus(status)}
                </span>
            </div>

            <p class="video-card-prompt">
                ${prompt}
            </p>

            <div class="video-card-meta">
                <span>
                    ${video.model || "Agnes Video v2.0"}
                </span>

                <span>
                    ${video.duration || 5}s
                </span>

                <span>
                    ${created}
                </span>
            </div>

            <div class="video-card-actions">
                ${actions}
            </div>

        </div>
    `;

    if (
        status === "COMPLETED" &&
        video.videoUrl
    ) {
        const previewElement =
            card.querySelector(
                ".video-card-preview"
            );

        if (previewElement) {
            previewElement.addEventListener(
                "click",
                () => playVideo(video.id)
            );
        }
    }

    return card;
}

function playVideo(videoId) {
    const video =
        allVideos.find(
            (item) =>
                Number(item.id) ===
                Number(videoId)
        );

    if (!video || !video.videoUrl) {
        return;
    }

    const modal =
        document.getElementById(
            "videoPlayerModal"
        );

    const player =
        document.getElementById(
            "videoPlayer"
        );

    const title =
        document.getElementById(
            "videoPlayerTitle"
        );

    if (!modal || !player) {
        window.open(
            video.videoUrl,
            "_blank"
        );

        return;
    }

    player.src = video.videoUrl;

    if (title) {
        title.textContent =
            video.title ||
            "Generated Video";
    }

    modal.classList.add("active");

    player.play().catch(() => {});
}

function closeVideoPlayer() {
    const modal =
        document.getElementById(
            "videoPlayerModal"
        );

    const player =
        document.getElementById(
            "videoPlayer"
        );

    if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
    }

    if (modal) {
        modal.classList.remove("active");
    }
}

function openDeleteModal(videoId) {
    videoToDelete = videoId;

    const modal =
        document.getElementById(
            "deleteModal"
        );

    if (modal) {
        modal.classList.add("active");
    }
}

function closeDeleteModal() {
    videoToDelete = null;

    const modal =
        document.getElementById(
            "deleteModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}

async function confirmDeleteVideo() {
    if (!videoToDelete) {
        return;
    }

    const id = videoToDelete;

    closeDeleteModal();

    try {
        const response =
            await EagleMotionAuth.authenticatedFetch(
                `${API_BASE}/videos/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Delete failed"
            );
        }

        allVideos =
            allVideos.filter(
                (video) =>
                    Number(video.id) !==
                    Number(id)
            );

        renderVideos();

    } catch (error) {
        console.error(error);

        alert(
            "Unable to delete this video."
        );
    }
}

function openRegenerateModal(videoId) {
    videoToRegenerate = videoId;

    const modal =
        document.getElementById(
            "regenerateModal"
        );

    if (modal) {
        modal.classList.add("active");
    }
}

function closeRegenerateModal() {
    videoToRegenerate = null;

    const modal =
        document.getElementById(
            "regenerateModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}

async function confirmRegenerateVideo() {
    if (!videoToRegenerate) {
        return;
    }

    const id = videoToRegenerate;

    closeRegenerateModal();

    alert(
        "Regeneration will be connected after the backend regeneration endpoint is added."
    );
}

function startProcessingRefresh() {
    const hasProcessing =
        allVideos.some(
            (video) =>
                video.status === "PROCESSING" ||
                video.status === "PENDING"
        );

    if (!hasProcessing) {
        return;
    }

    setTimeout(
        async () => {
            await refreshVideoStatus();
        },
        10000
    );
}

async function refreshVideoStatus() {
    try {
        const response =
            await EagleMotionAuth.authenticatedFetch(
                `${API_BASE}/videos`
            );

        if (!response.ok) {
            return;
        }

        allVideos =
            await response.json();

        renderVideos();

        startProcessingRefresh();

    } catch (error) {
        console.error(
            "Video refresh failed:",
            error
        );
    }
}

function showLoading() {
    const loading =
        document.getElementById(
            "videosLoading"
        );

    const empty =
        document.getElementById(
            "videosEmpty"
        );

    if (loading) {
        loading.style.display = "block";
    }

    if (empty) {
        empty.style.display = "none";
    }
}

function showError(message) {
    const grid =
        document.getElementById(
            "generatedVideosGrid"
        );

    if (grid) {
        grid.innerHTML = `
            <div class="video-error">
                ${escapeHtml(message)}
            </div>
        `;
    }

    const loading =
        document.getElementById(
            "videosLoading"
        );

    if (loading) {
        loading.style.display = "none";
    }
}

function formatStatus(status) {
    switch (status) {
        case "COMPLETED":
            return "Completed";

        case "PROCESSING":
            return "Generating";

        case "PENDING":
            return "Pending";

        case "FAILED":
            return "Failed";

        default:
            return status;
    }
}

function getStatusIcon(status) {
    switch (status) {
        case "PROCESSING":
        case "PENDING":
            return "Generating...";

        case "FAILED":
            return "Generation failed";

        default:
            return "Video";
    }
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

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
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

async function downloadVideo(videoId) {

    const video =
        allVideos.find(
            v => Number(v.id) === Number(videoId)
        );

    if (!video || !video.videoUrl) {
        alert("Video download is unavailable.");
        return;
    }

    try {

        const response =
            await EagleMotionAuth.authenticatedFetch(
                `${API_BASE}/videos/${videoId}/download`
            );

        if (!response.ok) {
            throw new Error("Download failed");
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            (video.title || "EagleMotion-Video")
                .replace(/[^a-z0-9-_]/gi, "_")
                + ".mp4";

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {

        console.error(
            "Video download failed:",
            error
        );

        alert(
            "Unable to download this video. Please try again."
        );
    }
}

