/*
 * EagleMotion AI
 * Main application JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {

    // MOBILE NAVIGATION
    var mobileMenuButton = document.querySelector(".mobile-menu-button");
    var mainNav = document.querySelector(".main-nav");

    if (mobileMenuButton && mainNav) {
        mobileMenuButton.addEventListener("click", function () {
            mainNav.classList.toggle("mobile-nav-open");
            mobileMenuButton.classList.toggle("active");
        });
    }

    // CLOSE MOBILE NAVIGATION
    document.querySelectorAll(".main-nav a").forEach(function (link) {
        link.addEventListener("click", function () {
            if (mainNav) {
                mainNav.classList.remove("mobile-nav-open");
            }

            if (mobileMenuButton) {
                mobileMenuButton.classList.remove("active");
            }
        });
    });

    // SMOOTH SCROLLING
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (event) {

            var targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            var target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // PROMPT CHARACTER COUNTER
    var promptFields = document.querySelectorAll(
        "textarea[data-maxlength], textarea#prompt, textarea[name='prompt']"
    );

    promptFields.forEach(function (textarea) {

        var maxLength = parseInt(
            textarea.dataset.maxlength || "1000",
            10
        );

        var counter = null;

        if (textarea.id) {
            counter = document.querySelector(
                '[data-counter-for="' + textarea.id + '"]'
            );
        }

        function updateCounter() {
            if (counter) {
                counter.textContent =
                    textarea.value.length + "/" + maxLength;
            }
        }

        textarea.addEventListener("input", function () {

            if (textarea.value.length > maxLength) {
                textarea.value =
                    textarea.value.substring(0, maxLength);
            }

            updateCounter();
        });

        updateCounter();
    });

    // IMAGE PREVIEW
    var imageInputs = document.querySelectorAll(
        'input[type="file"][accept*="image"]'
    );

    imageInputs.forEach(function (input) {

        input.addEventListener("change", function () {

            var file = input.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {

                if (typeof window.showEagleMotionToast === "function") {
                    window.showEagleMotionToast(
                        "Please select a valid image file."
                    );
                }

                input.value = "";
                return;
            }

            if (!input.id) {
                return;
            }

            var preview = document.querySelector(
                '[data-image-preview="' + input.id + '"]'
            );

            if (preview) {

                if (preview.dataset.objectUrl) {
                    URL.revokeObjectURL(
                        preview.dataset.objectUrl
                    );
                }

                var imageUrl = URL.createObjectURL(file);

                preview.src = imageUrl;
                preview.dataset.objectUrl = imageUrl;
                preview.style.display = "block";
            }

            window.dispatchEvent(
                new CustomEvent("eagleMotionImageSelected", {
                    detail: {
                        file: file
                    }
                })
            );
        });
    });

    // SHOW GENERATED VIDEO
    window.showVideoPreview = function (videoUrl) {

        if (!videoUrl) {
            return;
        }

        var videos = document.querySelectorAll(
            ".generated-video, #generatedVideo"
        );

        videos.forEach(function (video) {
            video.src = videoUrl;
            video.style.display = "block";
            video.load();
        });
    };

    // GENERATE VIDEO BUTTON
    var generateButtons = document.querySelectorAll(
        ".generate-video, #generateVideo, [data-generate-video]"
    );

    generateButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            window.dispatchEvent(
                new CustomEvent("eagleMotionGenerateVideo")
            );
        });
    });

    // AUTH MESSAGE
    window.showEagleMotionAuthMessage = function () {

        var existing = document.querySelector(
            ".auth-required-message"
        );

        if (existing) {
            existing.classList.add("show");
            return;
        }

        var authBox = document.createElement("div");

        authBox.className =
            "auth-required-message show";

        authBox.style.position = "fixed";
        authBox.style.inset = "0";
        authBox.style.zIndex = "9999";
        authBox.style.display = "flex";
        authBox.style.alignItems = "center";
        authBox.style.justifyContent = "center";
        authBox.style.background = "rgba(0,0,0,0.75)";
        authBox.style.padding = "20px";

        var content = document.createElement("div");

        content.style.background = "#0d1420";
        content.style.padding = "32px";
        content.style.borderRadius = "18px";
        content.style.textAlign = "center";
        content.style.maxWidth = "440px";
        content.style.width = "100%";

        content.innerHTML =
            "<h3 style='color:#ffffff;'>Create an account to generate videos</h3>" +
            "<p style='color:#94a3b8;'>Sign up for a free EagleMotion AI account to create, save, and manage your AI-generated videos.</p>" +
            "<div style='margin-top:20px;'>" +
            "<a href='register.html' class='btn btn-primary'>Create Free Account</a> " +
            "<a href='login.html' class='btn btn-secondary'>Log In</a>" +
            "</div>";

        var closeButton = document.createElement("button");

        closeButton.textContent = "Close";
        closeButton.type = "button";
        closeButton.style.marginTop = "20px";
        closeButton.style.padding = "8px 18px";
        closeButton.style.cursor = "pointer";

        closeButton.addEventListener("click", function () {
            authBox.remove();
        });

        content.appendChild(closeButton);
        authBox.appendChild(content);
        document.body.appendChild(authBox);
    };

    // TOAST
    window.showEagleMotionToast = function (message) {

        if (!message) {
            return;
        }

        var oldToast = document.querySelector(".eagle-toast");

        if (oldToast) {
            oldToast.remove();
        }

        var toast = document.createElement("div");

        toast.className = "eagle-toast";
        toast.textContent = message;

        toast.style.position = "fixed";
        toast.style.right = "20px";
        toast.style.bottom = "20px";
        toast.style.zIndex = "10000";
        toast.style.padding = "12px 18px";
        toast.style.background = "#111a27";
        toast.style.color = "#ffffff";
        toast.style.borderRadius = "8px";
        toast.style.border = "1px solid rgba(255,255,255,0.15)";

        document.body.appendChild(toast);

        setTimeout(function () {
            toast.remove();
        }, 3000);
    };

    // LOGOUT
    window.eagleMotionLogout = function () {

        localStorage.removeItem("eagleMotionToken");
        localStorage.removeItem("eagleMotionUser");

        window.location.href = "index.html";
    };

});