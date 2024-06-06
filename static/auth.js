const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const span = document.getElementById("response");

registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    span.innerHTML = null;
    const { login, password, confirmPassword } = registerForm;
    if (password.value !== confirmPassword.value) {
        span.style.color = "red";
        return span.innerHTML = "Passwords do not match";
    }

    const user = {
        login: login.value,
        password: password.value
    };

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });
        const result = await response.json();
        if (result.error) {
            span.style.color = "red";
            span.innerHTML = result.error;
        } else {
            span.style.color = "lime";
            span.innerHTML = result.res;
            setTimeout(() => {
                window.location.href = "/login";
            }, 1000);
        }
    } catch (error) {
        span.style.color = "red";
        span.innerHTML = "An error occurred during registration.";
    }
});

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    span.innerHTML = null;
    const { login, password } = loginForm;

    const user = {
        login: login.value,
        password: password.value
    };

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });
        const result = await response.json();
        if (result.error) {
            span.style.color = "red";
            span.innerHTML = result.error;
        } else {
            const token = result.token;
            let date = new Date();
            date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
            document.cookie = `token=${token};expires=${date.toUTCString()};path=/`;
            window.location.assign("/");
        }
    } catch (error) {
        span.style.color = "red";
        span.innerHTML = "An error occurred during login.";
    }
});