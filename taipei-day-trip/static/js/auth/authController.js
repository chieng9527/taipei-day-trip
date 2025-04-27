import {
  fetchLoginStatus,
  registerUser,
  loginUser
} from "../auth/authModel.js";

import {
  showError,
  hideError,
  resetForms,
  switchToRegister,
  switchToLogin,
  bindCloseModalEvents
} from "../auth/authView.js";


export function setupAuth(authModal, loginForm, registerForm, navAuth, navBooking, loginLink) {
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');

  authModal.style.display = 'none';
  authModal.classList.remove('show');
  bindCloseModalEvents(authModal, loginForm, registerForm);

  navBooking.onclick = (e) => {
    e.preventDefault();
    authModal.style.display = 'block';
    setTimeout(() => authModal.classList.add('show'), 10);
    resetForms(loginForm, registerForm);
  };

  navAuth?.addEventListener("click", (e) => {
    e.preventDefault();
    authModal.style.display = 'block';
    setTimeout(() => authModal.classList.add('show'), 10);
    resetForms(loginForm, registerForm);
  });

  loginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    authModal.style.display = 'block';
    setTimeout(() => authModal.classList.add('show'), 10);
    resetForms(loginForm, registerForm);
  });

  showRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    switchToRegister(loginForm, registerForm);
  });

  showLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    switchToLogin(registerForm, loginForm);
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const registerButton = e.target.querySelector('button[type="submit"]');
    registerButton.disabled = true;

    if (name.length < 2 || password.length < 8) {
      showError('registerError', '姓名需至少2字，密碼至少8字');
      registerButton.disabled = false;
      return;
    }

    const { ok, data } = await registerUser({ name, email, password });
    if (!ok) {
      showError("registerError", data.message);
    } else {
      showError("registerError", "註冊成功，請登入系統", true);
      setTimeout(() => {
        switchToLogin(registerForm, loginForm);
        document.getElementById("loginEmail").value = email;
        hideError("registerError");
      }, 1500);
    }
    registerButton.disabled = false;
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const loginButton = e.target.querySelector('button[type="submit"]');
    loginButton.disabled = true;

    const { ok, data } = await loginUser({ email, password });
    if (!ok) {
      showError("loginError", data.message);
    } else {
      localStorage.setItem("token", data.token);
      authModal.classList.remove("show");
      setTimeout(() => {
        authModal.style.display = "none";
        resetForms(loginForm, registerForm);
        location.reload();
      }, 300);
    }
    loginButton.disabled = false;
  });

  checkLoginStatus(navAuth, navBooking, authModal);
  if (window.location.pathname.startsWith("/thankyou") && !localStorage.getItem("token")) {
    window.location.href = "/";
  }
}

async function checkLoginStatus(navAuth, navBooking, authModal) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return updateNav(false, navAuth, navBooking, authModal);

    const result = await fetchLoginStatus(token);
    if (!result?.data) {
      localStorage.removeItem("token");
      updateNav(false, navAuth, navBooking, authModal);
    } else {
      updateNav(true, navAuth, navBooking, authModal);
    }
  } catch {
    localStorage.removeItem("token");
    updateNav(false, navAuth, navBooking, authModal);
  }
}

function updateNav(isLoggedIn, navAuth, navBooking, authModal) {
  if (isLoggedIn) {
    navAuth.textContent = "登出系統";
    navAuth.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      authModal.setAttribute("aria-hidden", "true");
      authModal.style.display = "none";
      setTimeout(() => location.reload(), 50);
    };
    navBooking.onclick = (e) => {
      e.preventDefault();
      window.location.href = "/booking";
    };
  } else {
    navAuth.textContent = "登入/註冊";
  }
}