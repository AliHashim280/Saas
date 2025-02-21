document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");

    function validateForm(form) {
        const inputs = form.querySelectorAll("input[required]");
        for (let input of inputs) {
            if (!input.value.trim()) {
                return false;
            }
        }
        return true;
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            if (!validateForm(registerForm)) {
                e.preventDefault();
                alert("Please fill out all fields before registering.");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            if (!validateForm(loginForm)) {
                e.preventDefault();
                alert("Please fill out all fields before logging in.");
            }
        });
    }
});
