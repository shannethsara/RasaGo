const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const ids = [
        "loginModal",
        "registerModal",
        "legalModal",
        "successModal"
    ];

    const modal = id => document.getElementById(id);

    function openModal(id) {
        ids.forEach(name => modal(name).classList.remove("is-visible"));
        modal(id).classList.add("is-visible");
        document.body.classList.add("auth-open");
    }

    function closeModal(id) {
        modal(id).classList.remove("is-visible");

        if (!ids.some(name => modal(name).classList.contains("is-visible"))) {
            document.body.classList.remove("auth-open");
        }
    }

    // Homepage Create Account buttons
    document.querySelectorAll(
        'a[href="pages/register.html"], #createAccountBtn'
    ).forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            openModal("registerModal");
        });
    });

    // Open Login if your navbar has a login button
    document.querySelectorAll("#loginBtn, a[href='pages/login.html']").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            openModal("loginModal");
        });
    });

    document.getElementById("openRegister").addEventListener("click", () => {
        openModal("registerModal");
    });

    document.getElementById("backToLogin").addEventListener("click", () => {
        openModal("loginModal");
    });

    document.querySelectorAll("[data-close]").forEach(button => {
        button.addEventListener("click", () => closeModal(button.dataset.close));
    });

    ids.forEach(id => {
        modal(id).addEventListener("click", event => {
            if (event.target === modal(id)) closeModal(id);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            ids.forEach(closeModal);
        }
    });

    document.getElementById("showLoginPhone").addEventListener("click", () => {
        document.getElementById("loginPhoneFields").hidden = false;
    });

    document.getElementById("showRegisterPhone").addEventListener("click", () => {
        document.getElementById("registerPhoneFields").hidden = false;
    });

    document.getElementById("showLegal").addEventListener("click", () => {
        document.getElementById("legalConsent").checked = false;
        document.getElementById("legalError").textContent = "";
        openModal("legalModal");
    });

    document.getElementById("agreeLegal").addEventListener("click", () => {
        if (!document.getElementById("legalConsent").checked) {
            document.getElementById("legalError").textContent =
                "Please accept the Privacy Policy and Terms to continue.";
            return;
        }

        closeModal("legalModal");
        document.getElementById("legalConsent").checked = false;
        const user = {
    name: document.getElementById("fullName").value.trim(),
    email: document.getElementById("registerEmail").value.trim(),
    phone: document.getElementById("registerPhone")?.value.trim() || ""
};

if (!user.name || !user.email) {
    alert("Please enter your name and email first.");
    openModal("registerModal");
    return;
}

window.rasagoDemoAccountCreated(user);
        openModal("successModal");
    });

    document.getElementById("successContinue").addEventListener("click", () => {
        closeModal("successModal");
    });

    // Visual demo only: no real account is created
    document.getElementById("registerForm").addEventListener("submit", event => {
        event.preventDefault();

        const password = document.getElementById("registerPassword").value;
        const confirm = document.getElementById("confirmPassword").value;

        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        openModal("legalModal");
    });

    document.getElementById("loginForm").addEventListener("submit", event => {
        event.preventDefault();
        alert("Login design demo only. Authentication will be added later.");
    });

    document.querySelectorAll(".demo-action").forEach(button => {
        button.addEventListener("click", () => {
            alert("Phone verification is a design demo. OTP is not sent.");
        });
    });

    ["googleLogin", "googleRegister"].forEach(id => {
        document.getElementById(id).addEventListener("click", () => {
            alert("Google Sign-In is a design demo only.");
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const USER_KEY = "rasagoDemoUser";

    const accountButton = document.getElementById("createAccountBtn");
    const profileWrap = document.getElementById("profileMenuWrap");
    const profileButton = document.getElementById("profileMenuBtn");
    const dropdown = document.getElementById("profileDropdown");

    function updateNavbar() {
        let user = null;

        try {
            user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
        } catch {
            user = null;
        }

        if (user) {
            if (accountButton) accountButton.hidden = true;
            if (profileWrap) profileWrap.hidden = false;

            document.getElementById("navUserName").textContent =
                user.name || "RasaGo User";

            document.getElementById("navUserEmail").textContent =
                user.email || "";

            return;
        }

        if (accountButton) accountButton.hidden = false;
        if (profileWrap) profileWrap.hidden = true;
    }

    updateNavbar();

    if (profileButton) {
        profileButton.addEventListener("click", () => {
            dropdown.hidden = !dropdown.hidden;
            profileButton.setAttribute("aria-expanded", String(!dropdown.hidden));
        });
    }

    document.addEventListener("click", event => {
        if (profileWrap && !profileWrap.contains(event.target)) {
            dropdown.hidden = true;
            profileButton?.setAttribute("aria-expanded", "false");
        }
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        localStorage.removeItem(USER_KEY);
        dropdown.hidden = true;
        updateNavbar();
        window.location.href = "index.html";
    });

    // Called after the demo registration and Terms flow succeeds.
    window.rasagoDemoAccountCreated = function (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        updateNavbar();
    };
});
