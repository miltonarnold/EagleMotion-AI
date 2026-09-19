/*
 * EagleMotion AI
 * Authentication JavaScript
 *
 * Handles:
 * - Registration
 * - Login
 * - JWT session storage
 * - Current user information
 * - Logout
 * - Authenticated API requests
 * - Backend session verification
 */

(() => {

    const API_BASE_URL = "http://localhost:8080/api";


    // ==========================================
    // ELEMENTS
    // ==========================================

    const loginForm = document.querySelector("#loginForm");
    const registerForm = document.querySelector("#registerForm");
    const authMessage = document.querySelector("#authMessage");


    // ==========================================
    // MESSAGE HELPERS
    // ==========================================

    function showMessage(message, type = "error") {

        if (!authMessage) {
            return;
        }

        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
        authMessage.style.display = "block";
    }


    function hideMessage() {

        if (!authMessage) {
            return;
        }

        authMessage.style.display = "none";
    }


    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================

    function saveSession(data) {

        if (!data || !data.token) {
            return false;
        }

        localStorage.setItem(
            "eagleMotionToken",
            data.token
        );

        localStorage.setItem(
            "eagleMotionUser",
            JSON.stringify({
                email: data.email || "",
                name: data.fullName || "",
                role: data.role || "USER"
            })
        );

        return true;
    }


    function clearSession() {

        localStorage.removeItem("eagleMotionToken");
        localStorage.removeItem("eagleMotionUser");
    }


    function getToken() {

        return localStorage.getItem("eagleMotionToken");
    }


    function getLoggedInUser() {

        const user = localStorage.getItem(
            "eagleMotionUser"
        );

        if (!user) {
            return null;
        }

        try {
            return JSON.parse(user);

        } catch (error) {

            console.error(
                "Unable to read saved user:",
                error
            );

            return null;
        }
    }


    function isLoggedIn() {

        return !!getToken();
    }


    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    // ==========================================
    // REGISTER
    // ==========================================

    if (registerForm) {

        registerForm.addEventListener("submit", async function(event) {

            // IMPORTANT:
            // Stop the browser from submitting the form
            // as a normal GET request.
            event.preventDefault();
            event.stopPropagation();

            hideMessage();


            const nameInput =
                document.querySelector("#name") ||
                registerForm.querySelector('input[name="name"]');

            const emailInput =
                document.querySelector("#email") ||
                registerForm.querySelector('input[name="email"]');

            const passwordInput =
                document.querySelector("#password") ||
                registerForm.querySelector('input[name="password"]');

            const confirmInput =
                document.querySelector("#confirmPassword") ||
                document.querySelector("#confirm-password") ||
                registerForm.querySelector(
                    'input[name="confirmPassword"]'
                );

            const termsInput =
                document.querySelector("#terms") ||
                registerForm.querySelector(
                    'input[type="checkbox"]'
                );


            const name = nameInput
                ? nameInput.value.trim()
                : "";

            const email = emailInput
                ? emailInput.value.trim().toLowerCase()
                : "";

            const password = passwordInput
                ? passwordInput.value
                : "";

            const confirmPassword = confirmInput
                ? confirmInput.value
                : "";


            // ======================================
            // VALIDATION
            // ======================================

            if (!name) {

                showMessage(
                    "Please enter your full name."
                );

                return;
            }


            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return;
            }


            if (!isValidEmail(email)) {

                showMessage(
                    "Please enter a valid email address."
                );

                return;
            }


            if (password.length < 8) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                return;
            }


            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match."
                );

                return;
            }


            if (termsInput && !termsInput.checked) {

                showMessage(
                    "Please accept the terms before creating your account."
                );

                return;
            }


            // ======================================
            // SUBMIT BUTTON
            // ======================================

            const submitButton =
                registerForm.querySelector(
                    'button[type="submit"], input[type="submit"]'
                );

            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled = true;

                if (submitButton.tagName === "BUTTON") {

                    submitButton.textContent =
                        "Creating account...";
                }
            }


            // ======================================
            // SEND TO SPRING BOOT BACKEND
            // ======================================

            try {

                console.log(
                    "Sending registration request to:",
                    `${API_BASE_URL}/auth/register`
                );


                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                fullName: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await readResponse(response);


                console.log(
                    "Registration response:",
                    response.status,
                    data
                );


                if (!response.ok) {

                    showMessage(
                        getErrorMessage(
                            data,
                            "Registration failed. Please try again."
                        )
                    );

                    return;
                }


                // ==================================
                // SAVE JWT SESSION
                // ==================================

                if (!saveSession(data)) {

                    showMessage(
                        "Account was created, but the login session could not be saved."
                    );

                    return;
                }


                showMessage(
                    "Account created successfully. Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 800);


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                showMessage(
                    "Unable to connect to EagleMotion AI. Please make sure the backend is running."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    if (
                        submitButton.tagName === "BUTTON" &&
                        originalText
                    ) {

                        submitButton.textContent =
                            originalText;
                    }
                }
            }

        });
    }


    // ==========================================
    // LOGIN
    // ==========================================

    if (loginForm) {

        loginForm.addEventListener("submit", async function(event) {

            event.preventDefault();
            event.stopPropagation();

            hideMessage();


            const emailInput =
                document.querySelector("#email") ||
                loginForm.querySelector('input[name="email"]');

            const passwordInput =
                document.querySelector("#password") ||
                loginForm.querySelector('input[name="password"]');


            const email = emailInput
                ? emailInput.value.trim().toLowerCase()
                : "";

            const password = passwordInput
                ? passwordInput.value
                : "";


            // ======================================
            // VALIDATION
            // ======================================

            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return;
            }


            if (!isValidEmail(email)) {

                showMessage(
                    "Please enter a valid email address."
                );

                return;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                return;
            }


            // ======================================
            // SUBMIT BUTTON
            // ======================================

            const submitButton =
                loginForm.querySelector(
                    'button[type="submit"], input[type="submit"]'
                );

            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled = true;

                if (submitButton.tagName === "BUTTON") {

                    submitButton.textContent =
                        "Signing in...";
                }
            }


            // ======================================
            // BACKEND LOGIN
            // ======================================

            try {

                console.log(
                    "Sending login request to:",
                    `${API_BASE_URL}/auth/login`
                );


                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await readResponse(response);


                if (!response.ok) {

                    showMessage(
                        getErrorMessage(
                            data,
                            "Incorrect email or password."
                        )
                    );

                    return;
                }


                if (!saveSession(data)) {

                    showMessage(
                        "Login succeeded, but the session could not be saved."
                    );

                    return;
                }


                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 700);


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    "Unable to connect to EagleMotion AI. Please make sure the backend is running."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    if (
                        submitButton.tagName === "BUTTON" &&
                        originalText
                    ) {

                        submitButton.textContent =
                            originalText;
                    }
                }
            }

        });
    }


    // ==========================================
    // PASSWORD VISIBILITY
    // ==========================================

    const passwordToggles =
        document.querySelectorAll(
            "[data-password-toggle]"
        );


    passwordToggles.forEach(toggle => {

        toggle.addEventListener("click", () => {

            const targetId =
                toggle.dataset.passwordToggle;

            const passwordField =
                document.getElementById(targetId);

            if (!passwordField) {
                return;
            }


            if (passwordField.type === "password") {

                passwordField.type = "text";
                toggle.textContent = "Hide";

            } else {

                passwordField.type = "password";
                toggle.textContent = "Show";
            }

        });

    });


    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    const forgotPassword =
        document.querySelector(
            "#forgotPassword, [href='#forgot-password']"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener("click", event => {

            event.preventDefault();

            showMessage(
                "Password recovery is not connected yet. Please contact EagleMotion AI support.",
                "info"
            );

        });
    }


    // ==========================================
    // DISPLAY CURRENT USER
    // ==========================================

    const currentUser = getLoggedInUser();


    if (currentUser) {

        document
            .querySelectorAll("[data-user-name]")
            .forEach(element => {

                element.textContent =
                    currentUser.name || "User";
            });


        document
            .querySelectorAll("[data-user-email]")
            .forEach(element => {

                element.textContent =
                    currentUser.email || "";
            });


        document
            .querySelectorAll("[data-user-role]")
            .forEach(element => {

                element.textContent =
                    currentUser.role || "USER";
            });
    }


    // ==========================================
    // LOGOUT
    // ==========================================

    document
        .querySelectorAll("[data-logout]")
        .forEach(button => {

            button.addEventListener("click", event => {

                event.preventDefault();

                clearSession();

                window.location.href =
                    "index.html";
            });

        });


    // ==========================================
    // PROTECTED PAGE CHECK
    // ==========================================

    const requiresAuthentication =
        document.querySelector(
            "[data-auth-required='true']"
        );


    if (
        requiresAuthentication &&
        !isLoggedIn()
    ) {

        window.location.href =
            "login.html";
    }


    // ==========================================
    // READ API RESPONSE
    // ==========================================

    async function readResponse(response) {

        const contentType =
            response.headers.get("content-type");


        if (
            contentType &&
            contentType.includes("application/json")
        ) {

            return await response.json();
        }


        const text =
            await response.text();


        return {
            message: text
        };
    }


    // ==========================================
    // API ERROR MESSAGE
    // ==========================================

    function getErrorMessage(data, fallback) {

        if (!data) {
            return fallback;
        }


        if (
            typeof data === "string" &&
            data.trim()
        ) {

            return data;
        }


        if (
            data.message &&
            typeof data.message === "string"
        ) {

            return data.message;
        }


        if (
            data.error &&
            typeof data.error === "string"
        ) {

            return data.error;
        }


        return fallback;
    }


    // ==========================================
    // AUTHENTICATED API REQUEST
    // ==========================================

    async function authenticatedFetch(
        endpoint,
        options = {}
    ) {

        const token = getToken();


        if (!token) {

            window.location.href =
                "login.html";

            throw new Error(
                "Authentication required."
            );
        }


        const headers = {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        };


        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers["Content-Type"]
        ) {

            headers["Content-Type"] =
                "application/json";
        }


        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearSession();

            window.location.href =
                "login.html";

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }


        return response;
    }


    // ==========================================
    // VERIFY BACKEND SESSION
    // ==========================================

    async function verifyBackendSession() {

        if (!getToken()) {
            return false;
        }


        try {

            const response =
                await authenticatedFetch(
                    "/user/me"
                );


            if (!response.ok) {
                return false;
            }


            const data =
                await readResponse(response);


            console.log(
                "EagleMotion AI backend session verified:",
                data
            );


            return true;

        } catch (error) {

            console.error(
                "Backend session verification failed:",
                error
            );

            return false;
        }
    }


    // ==========================================
    // EXPOSE AUTH API
    // ==========================================

    window.EagleMotionAuth = {

        getToken,
        getLoggedInUser,
        isLoggedIn,
        saveSession,
        clearSession,
        authenticatedFetch,
        verifyBackendSession,
        API_BASE_URL

    };

    console.log(
        "EagleMotion AI authentication system loaded."
    );

})();