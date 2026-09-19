/*
 * EagleMotion AI
 * Video Studio JavaScript
 *
 * Handles the video creation interface.
 * Supports:
 * - Text to Video
 * - Image to Video
 * - Prompt enhancement
 * - Image preview
 * - Video generation
 * - JWT authentication
 * - Video preview
 */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const promptInput =
        document.querySelector(
            "#videoPrompt, #prompt, textarea[name='prompt']"
        );

    const generateButton =
        document.querySelector(
            "#generateBtn, #generateVideo, .generate-video, [data-generate-video]"
        );

    const enhanceButton =
        document.querySelector(
            "#enhancePrompt, [data-enhance-prompt]"
        );

    const textModeButton =
        document.querySelector("#textMode");

    const imageModeButton =
        document.querySelector("#imageMode");

    const uploadBox =
        document.querySelector("#uploadBox");

    const imageInput =
        document.querySelector(
            "#imageUpload, #referenceImage, input[type='file'][accept*='image']"
        );

    const uploadTitle =
        document.querySelector("#uploadTitle");

    const uploadDescription =
        document.querySelector("#uploadDescription");

    const imagePreview =
        document.querySelector(
            "#imagePreview, [data-image-preview='referenceImage']"
        );

    const previewArea =
        document.querySelector(
            "#videoPreview, .video-preview"
        );

    const generatedVideo =
        document.querySelector(
            "#generatedVideo, .generated-video"
        );

    const generationStatus =
        document.querySelector(
            "#generationStatus, .generation-status"
        );

    const studioStatus =
        document.querySelector("#studioStatus");

    const authRequired =
        document.querySelector("#authRequired");


    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const auth = window.EagleMotionAuth;

    if (!auth) {
        console.error(
            "EagleMotion authentication system is not available."
        );
    }


    // ==========================================
    // STUDIO STATE
    // ==========================================

    const studioState = {

        mode: "text-to-video",

        prompt: "",

        referenceImage: null,

        model: "standard",

        aspectRatio: "16:9",

        duration: "5",

        style: "cinematic",

        isGenerating: false

    };


    // ==========================================
    // MODE BUTTONS
    // ==========================================

    if (textModeButton) {

        textModeButton.addEventListener("click", () => {

            setStudioMode("text-to-video");

        });

    }


    if (imageModeButton) {

        imageModeButton.addEventListener("click", () => {

            setStudioMode("image-to-video");

        });

    }


    function setStudioMode(mode) {

        studioState.mode = mode;

        const isImageMode =
            mode === "image-to-video";


        // -------------------------------
        // Update active button
        // -------------------------------

        if (textModeButton) {

            textModeButton.classList.toggle(
                "active",
                !isImageMode
            );

            textModeButton.setAttribute(
                "aria-pressed",
                String(!isImageMode)
            );

        }


        if (imageModeButton) {

            imageModeButton.classList.toggle(
                "active",
                isImageMode
            );

            imageModeButton.setAttribute(
                "aria-pressed",
                String(isImageMode)
            );

        }


        // -------------------------------
        // Enable / disable image upload
        // -------------------------------

        if (imageInput) {

            imageInput.disabled =
                !isImageMode;

        }


        if (uploadBox) {

            uploadBox.classList.toggle(
                "disabled",
                !isImageMode
            );

            uploadBox.style.pointerEvents =
                isImageMode ? "auto" : "none";

            uploadBox.style.opacity =
                isImageMode ? "1" : "0.55";

        }


        // -------------------------------
        // Update upload text
        // -------------------------------

        if (uploadTitle) {

            uploadTitle.textContent =
                isImageMode
                    ? "Add reference image"
                    : "Add reference image";

        }


        if (uploadDescription) {

            uploadDescription.textContent =
                isImageMode
                    ? "Upload a PNG, JPG, or WEBP image to guide the video."
                    : "Select Image to Video mode to upload a reference image.";

        }


        // -------------------------------
        // Update status
        // -------------------------------

        if (studioStatus) {

            studioStatus.textContent =
                isImageMode
                    ? "Image to Video mode selected."
                    : "Text to Video mode selected.";

        }


        // -------------------------------
        // Clear image when returning
        // to Text to Video
        // -------------------------------

        if (!isImageMode) {

            studioState.referenceImage =
                null;

            if (imageInput) {
                imageInput.value = "";
            }

            if (imagePreview) {

                imagePreview.removeAttribute("src");

                imagePreview.style.display =
                    "none";

            }

        }

    }


    // ==========================================
    // PROMPT INPUT
    // ==========================================

    if (promptInput) {

        promptInput.addEventListener(
            "input",
            () => {

                studioState.prompt =
                    promptInput.value;

                updateCharacterCount();

            }
        );

        updateCharacterCount();

    }


    function updateCharacterCount() {

        const counter =
            document.querySelector(
                "#characterCount, [data-prompt-count]"
            );

        if (!counter || !promptInput) {
            return;
        }


        const maximum =
            Number(
                promptInput.getAttribute(
                    "maxlength"
                )
            ) || 2000;


        counter.textContent =
            `${promptInput.value.length}/${maximum}`;

    }


    // ==========================================
    // IMAGE UPLOAD
    // ==========================================

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files &&
                    event.target.files[0];


                if (!file) {

                    studioState.referenceImage =
                        null;

                    return;

                }


                if (!file.type.startsWith("image/")) {

                    showStudioMessage(
                        "Please select a valid image file.",
                        "error"
                    );

                    imageInput.value = "";

                    studioState.referenceImage =
                        null;

                    return;

                }


                // Maximum 10 MB
                const maxSize =
                    10 * 1024 * 1024;


                if (file.size > maxSize) {

                    showStudioMessage(
                        "The image must be smaller than 10 MB.",
                        "error"
                    );

                    imageInput.value = "";

                    studioState.referenceImage =
                        null;

                    return;

                }


                studioState.referenceImage =
                    file;


                // -------------------------------
                // Image preview
                // -------------------------------

                if (imagePreview) {

                    const imageUrl =
                        URL.createObjectURL(file);

                    imagePreview.src =
                        imageUrl;

                    imagePreview.style.display =
                        "block";

                    imagePreview.onload = () => {

                        URL.revokeObjectURL(
                            imageUrl
                        );

                    };

                }


                // -------------------------------
                // File name
                // -------------------------------

                const uploadName =
                    document.querySelector(
                        "#imageFileName, [data-image-file-name]"
                    );


                if (uploadName) {

                    uploadName.textContent =
                        file.name;

                }


                showStudioMessage(
                    "Reference image selected.",
                    "success"
                );

            }
        );

    }


    // ==========================================
    // STUDIO OPTIONS
    // ==========================================

    const modelSelect =
        document.querySelector(
            "#model, #aiModel, select[name='model']"
        );


    if (modelSelect) {

        studioState.model =
            modelSelect.value ||
            studioState.model;


        modelSelect.addEventListener(
            "change",
            () => {

                studioState.model =
                    modelSelect.value;

            }
        );

    }


    const aspectSelect =
        document.querySelector(
            "#aspectRatio, select[name='aspectRatio']"
        );


    if (aspectSelect) {

        studioState.aspectRatio =
            aspectSelect.value ||
            studioState.aspectRatio;


        aspectSelect.addEventListener(
            "change",
            () => {

                studioState.aspectRatio =
                    aspectSelect.value;

            }
        );

    }


    const durationSelect =
        document.querySelector(
            "#duration, select[name='duration']"
        );


    if (durationSelect) {

        studioState.duration =
            durationSelect.value ||
            studioState.duration;


        durationSelect.addEventListener(
            "change",
            () => {

                studioState.duration =
                    durationSelect.value;

            }
        );

    }


    const styleSelect =
        document.querySelector(
            "#visualStyle, #style, select[name='style']"
        );


    if (styleSelect) {

        studioState.style =
            styleSelect.value ||
            studioState.style;


        styleSelect.addEventListener(
            "change",
            () => {

                studioState.style =
                    styleSelect.value;

            }
        );

    }


    // ==========================================
    // ENHANCE PROMPT
    // ==========================================

    if (enhanceButton) {

        enhanceButton.addEventListener(
            "click",
            () => {

                if (!promptInput) {
                    return;
                }


                const prompt =
                    promptInput.value.trim();


                if (!prompt) {

                    showStudioMessage(
                        "Enter a video idea first.",
                        "error"
                    );

                    return;

                }


                const enhancedPrompt =
                    enhancePromptText(prompt);


                promptInput.value =
                    enhancedPrompt;


                studioState.prompt =
                    enhancedPrompt;


                updateCharacterCount();


                showStudioMessage(
                    "Your prompt has been enhanced.",
                    "success"
                );

            }
        );

    }


    function enhancePromptText(prompt) {

        return `${prompt}. Create a visually engaging cinematic sequence with smooth camera movement, detailed composition, natural lighting, realistic motion, strong visual storytelling, and professional cinematic quality.`;

    }


    // ==========================================
    // GENERATE VIDEO
    // ==========================================

    if (generateButton) {

        generateButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                generateVideo();

            }
        );

    }


    async function generateVideo() {

        // --------------------------------------
        // REQUIRE LOGIN
        // --------------------------------------

        if (!auth || !auth.isLoggedIn()) {

            showAuthRequired();

            return;

        }


        // --------------------------------------
        // GET PROMPT
        // --------------------------------------

        const prompt =
            promptInput
                ? promptInput.value.trim()
                : "";


        if (!prompt) {

            showStudioMessage(
                "Describe the video you want to create.",
                "error"
            );


            if (promptInput) {
                promptInput.focus();
            }


            return;

        }


        // --------------------------------------
        // IMAGE MODE VALIDATION
        // --------------------------------------

        if (
            studioState.mode === "image-to-video" &&
            !studioState.referenceImage
        ) {

            showStudioMessage(
                "Upload a reference image before generating.",
                "error"
            );

            return;

        }


        // --------------------------------------
        // PREVENT DUPLICATES
        // --------------------------------------

        if (studioState.isGenerating) {
            return;
        }


        studioState.isGenerating =
            true;


        setGeneratingState(true);

        clearGeneratedPreview();


        try {

            // ----------------------------------
            // PREPARE REQUEST
            // ----------------------------------

            const requestBody = {

                title:
                    prompt.substring(0, 60) ||
                    "EagleMotion Video",

                prompt: prompt,

                mode:
                    studioState.mode === "image-to-video"
                        ? "IMAGE_TO_VIDEO"
                        : "TEXT_TO_VIDEO",

                model:
                    studioState.model,

                aspectRatio:
                    studioState.aspectRatio,

                duration:
                    Number(studioState.duration) || 5,

                visualStyle:
                    studioState.style

            };


            // ----------------------------------
            // IMAGE DATA
            // ----------------------------------

            if (
                studioState.mode === "image-to-video" &&
                studioState.referenceImage
            ) {

                requestBody.referenceImageName =
                    studioState.referenceImage.name;

            }


            showStudioMessage(
                "Sending your video request to EagleMotion AI...",
                "info"
            );


            // ----------------------------------
            // BACKEND REQUEST
            // ----------------------------------

            const response =
                await auth.authenticatedFetch(
                    "/videos/generate",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )
                    }
                );


            // ----------------------------------
            // HTTP ERROR
            // ----------------------------------

            if (!response.ok) {

                let errorMessage =
                    "Video generation failed.";


                try {

                    const errorData =
                        await response.json();


                    if (errorData.message) {

                        errorMessage =
                            errorData.message;

                    } else if (errorData.error) {

                        errorMessage =
                            errorData.error;

                    }

                } catch (error) {

                    console.error(
                        "Could not read backend error:",
                        error
                    );

                }


                throw new Error(
                    errorMessage
                );

            }


            // ----------------------------------
            // RESPONSE
            // ----------------------------------

            const videoData =
                await response.json();


            console.log(
                "EagleMotion video generated:",
                videoData
            );


            // ----------------------------------
            // VIDEO URL
            // ----------------------------------

            const videoUrl =
                videoData.videoUrl ||
                videoData.videoURL ||
                videoData.url;


            if (!videoUrl) {

                throw new Error(
                    "The video was generated but no video URL was returned by the backend."
                );

            }


            // ----------------------------------
            // SHOW VIDEO
            // ----------------------------------

            showGeneratedVideo(
                videoUrl
            );


            showStudioMessage(
                "Your video has been generated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "EagleMotion generation error:",
                error
            );


            showStudioMessage(
                error.message ||
                "Something went wrong while generating your video.",
                "error"
            );

        } finally {

            studioState.isGenerating =
                false;


            setGeneratingState(
                false
            );

        }

    }


    // ==========================================
    // GENERATION UI
    // ==========================================

    function setGeneratingState(
        isGenerating
    ) {

        if (generateButton) {

            generateButton.disabled =
                isGenerating;


            if (isGenerating) {

                if (
                    !generateButton.dataset.originalText
                ) {

                    generateButton.dataset.originalText =
                        generateButton.textContent;

                }


                generateButton.textContent =
                    "Generating...";

            } else {

                generateButton.textContent =
                    generateButton.dataset.originalText ||
                    "Generate Video";

            }

        }


        if (generationStatus) {

            generationStatus.style.display =
                isGenerating
                    ? "block"
                    : "none";


            if (isGenerating) {

                generationStatus.textContent =
                    "Generating your video with AI. Please wait...";

            }

        }

    }


    // ==========================================
    // CLEAR PREVIEW
    // ==========================================

    function clearGeneratedPreview() {

        if (!previewArea) {
            return;
        }


        if (generatedVideo) {

            generatedVideo.pause();

            generatedVideo.removeAttribute(
                "src"
            );

            generatedVideo.load();

            generatedVideo.style.display =
                "none";

        }


        const existing =
            previewArea.querySelector(
                ".generation-placeholder"
            );


        if (existing) {
            existing.remove();
        }

    }


    // ==========================================
    // SHOW GENERATED VIDEO
    // ==========================================

    function showGeneratedVideo(
        videoUrl
    ) {

        if (!previewArea || !videoUrl) {
            return;
        }


        if (!generatedVideo) {

            console.error(
                "Generated video element was not found."
            );

            return;

        }


        generatedVideo.src =
            videoUrl;


        generatedVideo.style.display =
            "block";


        generatedVideo.controls =
            true;


        generatedVideo.setAttribute(
            "preload",
            "metadata"
        );


        generatedVideo.load();


        const placeholder =
            previewArea.querySelector(
                ".generation-placeholder"
            );


        if (placeholder) {
            placeholder.remove();
        }


        const statusLabel =
            previewArea.querySelector(
                ".generated-status"
            );


        if (statusLabel) {

            statusLabel.textContent =
                "Video generated successfully";

        }

    }


    // ==========================================
    // AUTH REQUIRED
    // ==========================================

    function showAuthRequired() {

        let authBox =
            document.querySelector(
                ".studio-auth-required"
            );


        if (!authBox) {

            authBox =
                document.createElement(
                    "div"
                );


            authBox.className =
                "studio-auth-required";


            authBox.innerHTML = `

                <div class="studio-auth-card">

                    <button
                        class="studio-auth-close"
                        type="button"
                        aria-label="Close">
                        Close
                    </button>

                    <div class="studio-auth-icon">
                        E
                    </div>

                    <h3>
                        Create an account to generate videos
                    </h3>

                    <p>
                        Sign up for a free EagleMotion AI
                        account to generate, save, and
                        manage your videos.
                    </p>

                    <div class="studio-auth-actions">

                        <a
                            href="register.html"
                            class="btn btn-primary">
                            Create Free Account
                        </a>

                        <a
                            href="login.html"
                            class="btn btn-secondary">
                            Log In
                        </a>

                    </div>

                </div>

            `;


            document.body.appendChild(
                authBox
            );


            const closeButton =
                authBox.querySelector(
                    ".studio-auth-close"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    () => {

                        authBox.classList.remove(
                            "show"
                        );

                    }
                );

            }

        }


        authBox.classList.add(
            "show"
        );

    }


    // ==========================================
    // STUDIO MESSAGE
    // ==========================================

    function showStudioMessage(
        message,
        type = "info"
    ) {

        let messageBox =
            document.querySelector(
                ".studio-message"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );


            messageBox.className =
                "studio-message";


            document.body.appendChild(
                messageBox
            );

        }


        messageBox.textContent =
            message;


        messageBox.className =
            `studio-message ${type} show`;


        setTimeout(
            () => {

                messageBox.classList.remove(
                    "show"
                );

            },
            4500
        );

    }


    // ==========================================
    // SAVE PROJECT
    // ==========================================

    window.saveCurrentEagleMotionProject =
        async function() {

            if (!auth || !auth.isLoggedIn()) {

                showAuthRequired();

                return false;

            }


            const project = {

                name:
                    promptInput?.value
                        ?.substring(0, 50)
                    || "Untitled Project",

                prompt:
                    promptInput?.value
                    || "",

                mode:
                    studioState.mode,

                model:
                    studioState.model,

                aspectRatio:
                    studioState.aspectRatio,

                duration:
                    studioState.duration,

                style:
                    studioState.style

            };


            console.log(
                "EagleMotion project prepared:",
                project
            );


            showStudioMessage(
                "Project saving will be connected to the backend next.",
                "info"
            );


            return true;

        };


    // ==========================================
    // KEYBOARD SHORTCUT
    // ==========================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key === "Enter"
            ) {

                if (
                    promptInput &&
                    document.activeElement ===
                    promptInput
                ) {

                    event.preventDefault();

                    generateVideo();

                }

            }

        }
    );


    // ==========================================
    // STUDIO STYLES
    // ==========================================

    const studioStyles =
        document.createElement(
            "style"
        );


    studioStyles.textContent = `

        .studio-auth-required {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(8px);
        }

        .studio-auth-required.show {
            display: flex;
        }

        .studio-auth-card {
            position: relative;
            width: min(450px, 100%);
            padding: 32px;
            text-align: center;
            background: #0d1420;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 18px;
            box-shadow: 0 30px 90px rgba(0,0,0,0.5);
        }

        .studio-auth-close {
            position: absolute;
            top: 12px;
            right: 14px;
            border: 0;
            background: transparent;
            color: #94a3b8;
            font-size: 13px;
            cursor: pointer;
        }

        .studio-auth-icon {
            width: 55px;
            height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 18px;
            border-radius: 14px;
            background: #f4c430;
            color: #080b11;
            font-size: 24px;
            font-weight: 800;
        }

        .studio-auth-card h3 {
            margin: 0 0 10px;
            color: #ffffff;
            font-size: 21px;
        }

        .studio-auth-card p {
            margin: 0 auto 22px;
            max-width: 360px;
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
        }

        .studio-auth-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .studio-message {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 10000;
            max-width: 400px;
            padding: 13px 17px;
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

        .studio-message.show {
            opacity: 1;
            transform: translateY(0);
        }

        .studio-message.success {
            border-color: rgba(244,196,48,0.35);
        }

        .studio-message.error {
            border-color: rgba(255,80,80,0.35);
        }

        .studio-message.info {
            border-color: rgba(148,163,184,0.30);
        }

        .upload-box.disabled {
            opacity: 0.55;
            cursor: not-allowed;
        }

        @media (max-width: 500px) {

            .studio-auth-card {
                padding: 27px 20px;
            }

            .studio-auth-actions {
                flex-direction: column;
            }

            .studio-auth-actions .btn {
                width: 100%;
            }

            .studio-message {
                left: 16px;
                right: 16px;
                bottom: 16px;
            }

        }

    `;


    document.head.appendChild(
        studioStyles
    );


    // ==========================================
    // EXPOSE STUDIO FUNCTIONS
    // ==========================================

    window.EagleMotionStudio = {

        getState: () => ({
            ...studioState
        }),

        generateVideo,

        showGeneratedVideo,

        updateMode: setStudioMode

    };


    // ==========================================
    // INITIALIZE
    // ==========================================

    setStudioMode(
        "text-to-video"
    );


    console.log(
        "EagleMotion Studio loaded successfully."
    );

});