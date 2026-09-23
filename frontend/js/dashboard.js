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
    // GET CURRENT USER
    // ==========================================

    const currentUser =
        auth.getLoggedInUser();


    // ==========================================
    // DISPLAY USER INFORMATION
    // ==========================================

    updateUserInformation(
        currentUser
    );


    function updateUserInformation(user) {

        if (!user) {
            return;
        }


        document
            .querySelectorAll(
                "[data-user-name]"
            )
            .forEach(element => {

                element.textContent =
                    user.name || "User";

            });


        document
            .querySelectorAll(
                "[data-user-email]"
            )
            .forEach(element => {

                element.textContent =
                    user.email || "";

            });


        document
            .querySelectorAll(
                "[data-user-role]"
            )
            .forEach(element => {

                element.textContent =
                    user.role || "USER";

            });


        document
            .querySelectorAll(
                "[data-user-avatar]"
            )
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
    // DASHBOARD DATA
    // ==========================================

    let dashboardData = {

        videos: [],

        projects: [],

        credits: 10

    };


    // ==========================================
    // LOAD DASHBOARD DATA
    // ==========================================

    await loadDashboardData();


    async function loadDashboardData() {

        try {

            const response =
                await auth.authenticatedFetch(
                    "/videos"
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load your videos."
                );

            }


            const videos =
                await response.json();


            dashboardData = {

                videos:
                    Array.isArray(videos)
                        ? videos
                        : [],

                projects: [],

                credits: 10

            };


        } catch (error) {

            console.error(
                "Failed to load dashboard data:",
                error
            );

            /*
             * Do not destroy already loaded videos
             * if a later refresh temporarily fails.
             */

            dashboardData = {

                videos:
                    Array.isArray(
                        dashboardData.videos
                    )
                        ? dashboardData.videos
                        : [],

                projects:
                    Array.isArray(
                        dashboardData.projects
                    )
                        ? dashboardData.projects
                        : [],

                credits:
                    dashboardData.credits ?? 10

            };

        }


        updateDashboardStatistics(
            dashboardData
        );


        renderRecentVideos(
            dashboardData.videos
        );

        limitDashboardVideoList();


        updateCredits(
            dashboardData.credits
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

            const card =
                statCards[0];

            const elements =
                card.querySelectorAll("*");


            elements.forEach(element => {

                const text =
                    element.textContent.trim();


                if (text === "0") {

                    element.textContent =
                        videos.length;

                }

            });

        }


        // ------------------------------------------
        // SAVED PROJECTS
        // ------------------------------------------

        if (statCards.length >= 2) {

            const card =
                statCards[1];

            const elements =
                card.querySelectorAll("*");


            elements.forEach(element => {

                const text =
                    element.textContent.trim();


                if (text === "0") {

                    element.textContent =
                        projects.length;

                }

            });

        }


        // ------------------------------------------
        // GENERATION CREDITS
        // ------------------------------------------

        if (statCards.length >= 3) {

            const card =
                statCards[2];

            const elements =
                card.querySelectorAll("*");


            elements.forEach(element => {

                const text =
                    element.textContent.trim();


                if (text === "--") {

                    element.textContent =
                        data.credits ?? 0;

                }

            });

        }

    }


    // ==========================================
    // CREDITS
    // ==========================================

    function updateCredits(
        credits
    ) {

        const creditElements =
            document.querySelectorAll(
                "[data-credit-count]"
            );


        creditElements.forEach(
            element => {

                element.textContent =
                    credits;

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
                        (credits / 10) * 100
                    )
                );


            creditProgress.style.width =
                `${percentage}%`;

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

    if (!container) {
        container = document.createElement("div");
        container.id = "recentVideos";

        const panels =
            document.querySelectorAll(".dashboard-panel");

        const recentPanel =
            [...panels].find(panel =>
                panel.textContent
                    .toLowerCase()
                    .includes("recent videos")
            );

        if (!recentPanel) {
            return;
        }

        recentPanel.appendChild(container);
    }

    if (
        !Array.isArray(videoList) ||
        videoList.length === 0
    ) {
        renderEmptyVideos(container);
        return;
    }

    container.innerHTML = "";

    videoList
        .slice(0, 4)
        .forEach(video => {
            const card =
                createVideoCard(
                    video
                );
    seeMore.style.display =
        "inline-block";

    seeMore.style.marginTop =
        "20px";

    container.appendChild(
        seeMore
    );
}


function limitDashboardVideoList() {

    const list =
        document.querySelector(
            ".dashboard-video-list"
        );

    if (!list) {
        return;
    }

    const videos =
        [...list.querySelectorAll(
            ".dashboard-video-item"
        )];

    videos
        .slice(4)
        .forEach(video => video.remove());

    if (
        !list.parentElement.querySelector(
            ".dashboard-see-more"
        )
    ) {
        const seeMore =
            document.createElement("a");

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

        list.parentElement.appendChild(
            seeMore
        );
    }
}

// ==========================================
// EMPTY VIDEO STATE
// ==========================================
    // ==========================================

    function renderEmptyVideos(
        container
    ) {

        container.innerHTML = `

            <div class="dashboard-empty-state">

                <div class="dashboard-empty-icon">
                    E
                </div>

                <h3>
                    No videos yet
                </h3>

                <p>
                    Your generated videos will appear here.
                </p>

                <a
                    href="studio.html"
                    class="small-button"
                >
                    Create your first video
                </a>

            </div>

        `;

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

        card.style.cursor = "pointer";

        card.addEventListener(
            "click",
            () => {
                window.location.href =
                    "generated-videos.html";
            }
        );



        const title =
            video.title ||
            "Untitled Video";


        const date =
            formatDate(
                video.createdAt
            );


        const videoUrl =
            video.url ||
            video.videoUrl ||
            "";


        card.innerHTML = `

            <div class="dashboard-video-thumbnail">

                ${
                    videoUrl
                    ?
                    `
                    <video
                        src="${escapeHtml(videoUrl)}"
                        muted
                        preload="metadata">
                    </video>
                    `
                    :
                    `
                    <div class="dashboard-video-placeholder">
                        E
                    </div>
                    `
                }

            </div>


            <div class="dashboard-video-info">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <span>
                    ${date}
                </span>

            </div>


            <button
                type="button"
                class="dashboard-video-menu"
                data-video-id="${escapeHtml(video.id || "")}"
            >
                More
            </button>

        `;


        const menuButton =
            card.querySelector(
                ".dashboard-video-menu"
            );


        if (menuButton) {

            menuButton.addEventListener(
                "click",
                () => {

                    showVideoActions(
                        video
                    );

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

        const existing =
            document.querySelector(
                ".video-actions-menu"
            );


        if (existing) {
            existing.remove();
        }


        const menu =
            document.createElement(
                "div"
            );


        menu.className =
            "video-actions-menu";


        menu.innerHTML = `

            <div class="video-actions-card">

                <button
                    type="button"
                    data-action="open"
                >
                    Open Video
                </button>


                <button
                    type="button"
                    data-action="download"
                >
                    Download
                </button>


                <button
                    type="button"
                    data-action="delete"
                >
                    Delete
                </button>


                <button
                    type="button"
                    data-action="close"
                >
                    Cancel
                </button>

            </div>

        `;


        document.body.appendChild(
            menu
        );


        menu.addEventListener(
            "click",
            async event => {

                const action =
                    event.target.dataset.action;


                if (!action) {
                    return;
                }


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

    }


    // ==========================================
    // OPEN VIDEO
    // ==========================================

    function openVideo(
        video
    ) {

        const videoUrl =
            video.url ||
            video.videoUrl ||
            "";


        if (!videoUrl) {

            showDashboardToast(
                "This video is not available yet."
            );

            return;
        }


        window.open(
            videoUrl,
            "_blank"
        );

    }


    // ==========================================
    // DOWNLOAD VIDEO
    // ==========================================

    function downloadVideo(
        video
    ) {

        const videoUrl =
            video.url ||
            video.videoUrl ||
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
            `${sanitizeFilename(
                video.title ||
                "eaglemotion-video"
            )}.mp4`;


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
         * The real DELETE endpoint will be connected
         * after the Video entity and VideoController
         * are added to Spring Boot.
         */

        showDashboardToast(
            "Video deletion will be connected to the backend."
        );

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

        return String(value)
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

        return String(value)
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
            ) ||
            "eaglemotion-video";

    }


    // ==========================================
    // CREATE VIDEO BUTTONS
    // ==========================================

    document
        .querySelectorAll(
            "[data-create-video]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        "studio.html";

                }
            );

        });


    // ==========================================
    // DASHBOARD LOGOUT
    // ==========================================

    document
        .querySelectorAll(
            "[data-dashboard-logout]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    auth.clearSession();

                    window.location.href =
                        "index.html";

                }
            );

        });


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


        .dashboard-video-info h3 {
            margin: 0 0 6px;
            color: #ffffff;
            font-size: 14px;
        }


        .dashboard-video-info span {
            color: #64748b;
            font-size: 11px;
        }


        .dashboard-video-menu {
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


    document.head.appendChild(
        dashboardStyles
    );


    // ==========================================
    // EXPOSE DASHBOARD DATA
    // ==========================================

    window.EagleMotionDashboard = {

        getData: () =>
            dashboardData,

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






