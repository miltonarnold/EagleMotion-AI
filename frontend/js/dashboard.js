/*
 * EagleMotion AI
 * Dashboard JavaScript
 *
 * Handles:
 * - Dashboard authentication
 * - Backend session verification
 * - User information
 * - Dashboard statistics
 * - Recent videos
 * - Video actions
 * - Dashboard navigation
 * - Backend video/project loading
 */

document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const auth = window.EagleMotionAuth;

    if (!auth) {
        console.error(
            "EagleMotion authentication system is not available."
        );

        window.location.href = "login.html";
        return;
    }

    if (!auth.isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    console.log(
        "EagleMotion AI dashboard connected to backend."
    );

    // ==========================================
    // DASHBOARD DATA
    // ==========================================

    let dashboardData = {
        videos: [],
        projects: [],
        credits: 10
    };

    // ==========================================
    // GET CURRENT USER
    // ==========================================

    const currentUser =
        typeof auth.getLoggedInUser === "function"
            ? auth.getLoggedInUser()
            : null;

    // ==========================================
    // DISPLAY USER INFORMATION
    // ==========================================

    updateUserInformation(currentUser);

    function updateUserInformation(user) {

        if (!user) {
            return;
        }

        document
            .querySelectorAll("[data-user-name]")
            .forEach(element => {
                element.textContent =
                    user.name || "User";
            });

        document
            .querySelectorAll("[data-user-email]")
            .forEach(element => {
                element.textContent =
                    user.email || "";
            });

        document
            .querySelectorAll("[data-user-role]")
            .forEach(element => {
                element.textContent =
                    user.role || "USER";
            });

        document
            .querySelectorAll("[data-user-avatar]")
            .forEach(element => {

                const name =
                    user.name || "User";

                element.textContent =
                    name
                        .charAt(0)
                        .toUpperCase();
            });
    }

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    await loadDashboardData();

    async function loadDashboardData() {

        try {

            if (
                !auth ||
                typeof auth.authenticatedFetch !== "function"
            ) {
                throw new Error(
                    "Authentication service is unavailable."
                );
            }

            const response =
                await auth.authenticatedFetch(
                    "/videos"
                );

            if (!response.ok) {

                throw new Error(
                    "Failed to load your videos (" +
                    response.status +
                    ")."
                );
            }

            const data =
                await response.json();

            /*
             * The backend currently returns
             * an array of videos.
             */

            const videos =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.videos)
                        ? data.videos
                        : [];

            dashboardData = {

                videos:
                    videos,

                projects: [],

                credits:
                    dashboardData.credits ?? 10

            };

        } catch (error) {

            console.error(
                "Failed to load dashboard data:",
                error
            );

            /*
             * Keep existing dashboard data if
             * a refresh temporarily fails.
             */

        }

        updateDashboardStatistics(
            dashboardData
        );

        updateCredits(
            dashboardData.credits
        );

        renderRecentVideos(
            dashboardData.videos
        );

    }

    // ==========================================
    // DASHBOARD STATISTICS
    // ==========================================

    function updateDashboardStatistics(data) {

        const videos =
            Array.isArray(data.videos)
                ? data.videos
                : [];

        const projects =
            Array.isArray(data.projects)
                ? data.projects
                : [];

        const statCards =
            document.querySelectorAll(
                ".dashboard-stats .stat-card"
            );

        // ------------------------------------------
        // VIDEOS CREATED
        // ------------------------------------------

        if (statCards.length >= 1) {

            updateStatCardValue(
                statCards[0],
                videos.length
            );

        }

        // ------------------------------------------
        // SAVED PROJECTS
        // ------------------------------------------

        if (statCards.length >= 2) {

            updateStatCardValue(
                statCards[1],
                projects.length
            );

        }

        // ------------------------------------------
        // GENERATION CREDITS
        // ------------------------------------------

        if (statCards.length >= 3) {

            updateStatCardValue(
                statCards[2],
                data.credits ?? 0
            );

        }

    }

    function updateStatCardValue(
        card,
        value
    ) {

        if (!card) {
            return;
        }

        /*
         * Prefer common stat-number selectors
         * if they exist in the dashboard HTML.
         */

        const preferred =
            card.querySelector(
                ".stat-value, .stat-number, [data-stat-value]"
            );

        if (preferred) {

            preferred.textContent =
                value;

            return;
        }

        /*
         * Fallback:
         * Replace an existing numeric placeholder.
         */

        const elements =
            card.querySelectorAll("*");

        for (const element of elements) {

            const text =
                element.textContent.trim();

            if (
                text === "0" ||
                text === "--"
            ) {

                element.textContent =
                    value;

                return;
            }

        }

    }

    // ==========================================
    // CREDITS
    // ==========================================

    function updateCredits(
        credits
    ) {

        const safeCredits =
            Number.isFinite(
                Number(credits)
            )
                ? Number(credits)
                : 0;

        const creditElements =
            document.querySelectorAll(
                "[data-credit-count]"
            );

        creditElements.forEach(
            element => {

                element.textContent =
                    safeCredits;

            }
        );

        const creditProgress =
            document.querySelector(
                "[data-credit-progress]"
            );

        if (creditProgress) {

            const percentage =
                Math.min(
                    100,
                    Math.max(
                        0,
                        (safeCredits / 10) * 100
                    )
                );

            creditProgress.style.width =
                percentage + "%";

        }

    }

    // ==========================================
    // RECENT VIDEOS
    // ==========================================

    function renderRecentVideos(
        videoList
    ) {

        let container =
            document.querySelector(
                "#recentVideos, [data-recent-videos]"
            );

        /*
         * If the HTML does not already contain
         * the recent videos container, create it
         * inside the Recent Videos panel.
         */

        if (!container) {

            const panels =
                document.querySelectorAll(
                    ".dashboard-panel"
                );

            const recentPanel =
                [...panels].find(
                    panel =>
                        panel.textContent
                            .toLowerCase()
                            .includes(
                                "recent videos"
                            )
                );

            if (!recentPanel) {
                console.warn(
                    "Recent Videos dashboard panel was not found."
                );

                return;
            }

            container =
                document.createElement(
                    "div"
                );

            container.id =
                "recentVideos";

            recentPanel.appendChild(
                container
            );

        }

        /*
         * Always remove the old See More button
         * before rebuilding the list.
         */

        const existingSeeMore =
            container.parentElement
                ? container.parentElement.querySelector(
                    ".dashboard-see-more"
                )
                : null;

        if (existingSeeMore) {
            existingSeeMore.remove();
        }

        /*
         * Empty state.
         */

        if (
            !Array.isArray(videoList) ||
            videoList.length === 0
        ) {

            renderEmptyVideos(
                container
            );

            return;
        }

        /*
         * Clear old cards.
         */

        container.innerHTML =
            "";

        /*
         * Dashboard shows ONLY the four
         * most recent videos.
         */

        const recentVideos =
            videoList.slice(0, 4);

        recentVideos.forEach(
            video => {

                const card =
                    createVideoCard(
                        video
                    );

                container.appendChild(
                    card
                );

            }
        );

        /*
         * Show See More when there are
         * more than four videos.
         */

        if (
            videoList.length > 4 &&
            container.parentElement
        ) {

            createSeeMoreButton(
                container.parentElement
            );

        }

    }

    // ==========================================
    // SEE MORE BUTTON
    // ==========================================

    function createSeeMoreButton(
        parent
    ) {

        if (!parent) {
            return;
        }

        if (
            parent.querySelector(
                ".dashboard-see-more"
            )
        ) {
            return;
        }

        const seeMore =
            document.createElement(
                "a"
            );

        seeMore.href =
            "generated-videos.html";

        seeMore.className =
            "small-button dashboard-see-more";

        seeMore.textContent =
            "See more";

        seeMore.style.display =
            "inline-block";

        seeMore.style.marginTop =
            "20px";

        parent.appendChild(
            seeMore
        );

    }

    // ==========================================
    // EMPTY VIDEO STATE
    // ==========================================

    function renderEmptyVideos(
        container
    ) {

        if (!container) {
            return;
        }

        container.innerHTML =
            '<div class="dashboard-empty-state">' +
                '<div class="dashboard-empty-icon">E</div>' +
                '<h3>No videos yet</h3>' +
                '<p>Your generated videos will appear here.</p>' +
                '<a href="studio.html" class="small-button">Create your first video</a>' +
            '</div>';

    }

    // ==========================================
    // CREATE VIDEO CARD
    // ==========================================

    function createVideoCard(
        video
    ) {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "dashboard-video-card";

        card.style.cursor =
            "pointer";

        /*
         * Normalize possible backend URL names.
         */

        const videoUrl =
            video.videoUrl ||
            video.videoURL ||
            video.url ||
            "";

        const title =
            video.title ||
            video.prompt ||
            "Untitled Video";

        const date =
            formatDate(
                video.createdAt ||
                video.created_at
            );

        /*
         * Clicking the card opens
         * the Generated Videos page.
         */

        card.addEventListener(
            "click",
            event => {

                /*
                 * Do not redirect when the
                 * More button was clicked.
                 */

                if (
                    event.target.closest(
                        ".dashboard-video-menu"
                    )
                ) {
                    return;
                }

                window.location.href =
                    "generated-videos.html";

            }
        );

        /*
         * Build the card.
         */
        card.innerHTML =
            '<div class="dashboard-video-thumbnail">' +
                (videoUrl
                    ? '<video src="' + escapeHtml(videoUrl) + '" muted playsinline preload="metadata"></video>'
                    : '<div class="dashboard-video-placeholder">E</div>') +
            '</div>' +
            '<div class="dashboard-video-info">' +
                '<h3>' + escapeHtml(title) + '</h3>' +
                '<span>' + escapeHtml(date) + '</span>' +
            '</div>';
        /*
         * More button.
         */

        const menuButton =
            card.querySelector(
                ".dashboard-video-menu"
            );

        if (menuButton) {

            menuButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    showVideoActions(
                        video
                    );

                }
            );

        }

        /*
         * Prevent video interaction from
         * accidentally opening the page.
         */

        const preview =
            card.querySelector(
                ".dashboard-video-thumbnail video"
            );

        if (preview) {

            preview.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    window.location.href =
                        "generated-videos.html";

                }
            );

        }

        return card;

    }

    // ==========================================
    // VIDEO ACTIONS
    // ==========================================

    function showVideoActions(
        video
    ) {

        /*
         * Remove an existing menu first.
         */

        const existing =
            document.querySelector(
                ".video-actions-menu"
            );

        if (existing) {
            existing.remove();
        }

        /*
         * Create overlay.
         */

        const menu =
            document.createElement(
                "div"
            );

        menu.className =
            "video-actions-menu";
        menu.innerHTML =
            '<div class="video-actions-card" role="dialog" aria-modal="true">' +
                '<button type="button" data-action="open">Open Video</button>' +
                '<button type="button" data-action="download">Download</button>' +
                '<button type="button" data-action="delete">Delete</button>' +
                '<button type="button" data-action="cancel">Cancel</button>' +
            '</div>';
        document.body.appendChild(
            menu
        );

        /*
         * Handle actions.
         */

        menu.addEventListener(
            "click",
            async event => {

                event.stopPropagation();

                /*
                 * Clicking the dark overlay closes
                 * the menu.
                 */

                if (
                    event.target === menu
                ) {

                    menu.remove();

                    return;
                }

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                if (action === "open") {

                    openVideo(
                        video
                    );

                    menu.remove();

                    return;
                }

                if (action === "download") {

                    downloadVideo(
                        video
                    );

                    menu.remove();

                    return;
                }

                if (action === "delete") {

                    await deleteVideo(
                        video
                    );

                    menu.remove();

                    return;
                }

                if (action === "close") {

                    menu.remove();

                }

            }
        );

        /*
         * Allow Escape to close the menu.
         */

        const escapeHandler =
            event => {

                if (
                    event.key === "Escape"
                ) {

                    menu.remove();

                    document.removeEventListener(
                        "keydown",
                        escapeHandler
                    );

                }

            };

        document.addEventListener(
            "keydown",
            escapeHandler
        );

    }

    // ==========================================
    // OPEN VIDEO
    // ==========================================

    function openVideo(
        video
    ) {

        const videoUrl =
            video.videoUrl ||
            video.videoURL ||
            video.url ||
            "";

        if (!videoUrl) {

            showDashboardToast(
                "This video is not available yet."
            );

            return;
        }

        window.open(
            videoUrl,
            "_blank",
            "noopener,noreferrer"
        );

    }

    // ==========================================
    // DOWNLOAD VIDEO
    // ==========================================

    function downloadVideo(
        video
    ) {

        const videoUrl =
            video.videoUrl ||
            video.videoURL ||
            video.url ||
            "";

        if (!videoUrl) {

            showDashboardToast(
                "There is no video file available yet."
            );

            return;
        }

        const link =
            document.createElement(
                "a"
            );

        link.href =
            videoUrl;

        link.download =
            sanitizeFilename(
                video.title ||
                "eaglemotion-video"
            ) + ".mp4";

        link.target =
            "_blank";

        link.rel =
            "noopener";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

    }

    // ==========================================
    // DELETE VIDEO
    // ==========================================

    async function deleteVideo(
        video
    ) {

        const confirmed =
            window.confirm(
                "Delete this video from your dashboard?"
            );

        if (!confirmed) {
            return;
        }

        /*
         * Use the existing authenticated backend
         * DELETE endpoint when a video ID exists.
         */

        if (
            !video ||
            !video.id
        ) {

            showDashboardToast(
                "This video cannot be deleted because its ID is missing."
            );

            return;
        }

        try {

            if (
                !auth ||
                typeof auth.authenticatedFetch !==
                    "function"
            ) {

                throw new Error(
                    "Authentication service is unavailable."
                );

            }

            const response =
                await auth.authenticatedFetch(
                    "/videos/" +
                    encodeURIComponent(
                        video.id
                    ),
                    {
                        method: "DELETE"
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Delete failed (" +
                    response.status +
                    ")."
                );

            }

            /*
             * Remove the deleted video locally
             * without reloading the entire page.
             */

            dashboardData.videos =
                dashboardData.videos.filter(
                    item =>
                        String(item.id) !==
                        String(video.id)
                );

            updateDashboardStatistics(
                dashboardData
            );

            renderRecentVideos(
                dashboardData.videos
            );

            showDashboardToast(
                "Video deleted successfully."
            );

        } catch (error) {

            console.error(
                "Dashboard video deletion failed:",
                error
            );

            showDashboardToast(
                error.message ||
                "Unable to delete this video."
            );

        }

    }

    // ==========================================
    // DATE FORMAT
    // ==========================================

    function formatDate(
        dateString
    ) {

        if (!dateString) {
            return "Recently";
        }

        const date =
            new Date(
                dateString
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Recently";

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

    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }

    // ==========================================
    // SANITIZE FILE NAME
    // ==========================================

    function sanitizeFilename(
        value
    ) {

        return String(
            value || ""
        )
            .replace(
                /[<>:"/\\|?*]/g,
                ""
            )
            .trim()
            .replace(
                /\s+/g,
                "-"
            )
            .substring(
                0,
                100
            )
            ||
            "eaglemotion-video";

    }

    // ==========================================
    // CREATE VIDEO BUTTONS
    // ==========================================

    document
        .querySelectorAll(
            "[data-create-video]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        window.location.href =
                            "studio.html";

                    }
                );

            }
        );

    // ==========================================
    // DASHBOARD LOGOUT
    // ==========================================

    document
        .querySelectorAll(
            "[data-dashboard-logout]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        if (
                            auth &&
                            typeof auth.clearSession ===
                                "function"
                        ) {

                            auth.clearSession();

                        }

                        window.location.href =
                            "index.html";

                    }
                );

            }
        );

    // ==========================================
    // REFRESH DASHBOARD
    // ==========================================

    window.refreshEagleMotionDashboard =
        async function() {

            await loadDashboardData();

        };

    // ==========================================
    // DASHBOARD TOAST
    // ==========================================

    function showDashboardToast(
        message
    ) {

        let toast =
            document.querySelector(
                ".dashboard-toast"
            );

        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.className =
                "dashboard-toast";

            document.body.appendChild(
                toast
            );

        }

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );

        clearTimeout(
            toast.dashboardTimeout
        );

        toast.dashboardTimeout =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3000
            );

    }

    // ==========================================
    // DASHBOARD STYLES
    // ==========================================

    const dashboardStyles =
        document.createElement(
            "style"
        );

    dashboardStyles.textContent = `

        .dashboard-empty-state {
            min-height: 220px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 30px;
        }

        .dashboard-empty-icon {
            width: 55px;
            height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: rgba(255,255,255,0.04);
            color: #64748b;
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 15px;
        }

        .dashboard-empty-state h3 {
            margin: 0 0 7px;
            color: #ffffff;
            font-size: 16px;
        }

        .dashboard-empty-state p {
            margin: 0 0 18px;
            color: #64748b;
            font-size: 13px;
        }

        .dashboard-video-card {
            position: relative;
            display: grid;
            grid-template-columns: 130px 1fr auto;
            align-items: center;
            gap: 15px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 11px;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(255,255,255,0.05);
        }

        .dashboard-video-thumbnail {
            width: 130px;
            height: 76px;
            overflow: hidden;
            border-radius: 8px;
            background: #070b12;
        }

        .dashboard-video-thumbnail video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .dashboard-video-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f4c430;
            background:
                linear-gradient(
                    135deg,
                    rgba(244,196,48,0.12),
                    #070b12
                );
            font-size: 20px;
            font-weight: 800;
        }

        .dashboard-video-info {
            min-width: 0;
        }

        .dashboard-video-info h3 {
            margin: 0 0 6px;
            color: #ffffff;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dashboard-video-info span {
            color: #64748b;
            font-size: 11px;
        }

        .dashboard-video-menu {
            position: relative;
            z-index: 2;
            border: 0;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            padding: 8px;
            font-size: 12px;
        }

        .dashboard-video-menu:hover {
            color: #ffffff;
        }

        .video-actions-menu {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(6px);
        }

        .video-actions-card {
            width: min(300px, 90%);
            padding: 10px;
            border-radius: 13px;
            background: #0d1420;
            border: 1px solid rgba(255,255,255,0.10);
            box-shadow:
                0 25px 70px rgba(0,0,0,0.45);
        }

        .video-actions-card button {
            width: 100%;
            padding: 12px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #cbd5e1;
            text-align: left;
            cursor: pointer;
            font-size: 13px;
        }

        .video-actions-card button:hover {
            background: rgba(255,255,255,0.05);
            color: #ffffff;
        }

        .video-actions-card
        button[data-action="delete"] {
            color: #f87171;
        }

        .dashboard-see-more {
            margin-bottom: 10px;
        }

        .dashboard-toast {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 10000;
            max-width: 350px;
            padding: 12px 17px;
            border-radius: 9px;
            background: #111a27;
            border: 1px solid rgba(255,255,255,0.10);
            color: #ffffff;
            font-size: 13px;
            opacity: 0;
            transform: translateY(15px);
            pointer-events: none;
            transition: 0.25s ease;
        }

        .dashboard-toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        @media (max-width: 600px) {

            .dashboard-video-card {
                grid-template-columns:
                    90px 1fr auto;
            }

            .dashboard-video-thumbnail {
                width: 90px;
                height: 65px;
            }

            .dashboard-video-info h3 {
                font-size: 12px;
            }

        }

    `;

    /*
     * Avoid injecting duplicate dashboard styles
     * if the dashboard script is initialized again.
     */

    const existingDashboardStyles =
        document.getElementById(
            "eaglemotion-dashboard-styles"
        );

    if (!existingDashboardStyles) {

        dashboardStyles.id =
            "eaglemotion-dashboard-styles";

        document.head.appendChild(
            dashboardStyles
        );

    }

    // ==========================================
    // EXPOSE DASHBOARD DATA
    // ==========================================

    window.EagleMotionDashboard = {

        getData:
            () => dashboardData,

        refresh:
            window.refreshEagleMotionDashboard

    };

    // ==========================================
    // INITIALIZE
    // ==========================================

    console.log(
        "EagleMotion AI dashboard initialized."
    );

});





