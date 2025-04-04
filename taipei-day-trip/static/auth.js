document.addEventListener('DOMContentLoaded', function () {
    // 獲取元素
    const authModal = document.getElementById('authModal');
    const loginLink = document.querySelector('.nav__item:last-child a');
    const openAuthModal = document.getElementById("openAuthModal");
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const closeModal = document.getElementById('closeModal');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');


    authModal.style.display = 'none';
    authModal.classList.remove('show');
    loginLink.textContent = '載入中...';

    // 錯誤訊息處理
    function showError(elementId, message, isSuccess = false) {
        const errorDiv = document.getElementById(elementId);
        errorDiv.textContent = message;
        errorDiv.style.color = isSuccess ? '#32c273' : '#D20B2E';
        errorDiv.classList.add('show');

        if (!isSuccess) {
            setTimeout(() => {
                hideError(elementId);
            }, 2000);
        }
    }

    function hideError(elementId) {
        const errorDiv = document.getElementById(elementId);
        errorDiv.classList.remove('show');
        setTimeout(() => {
            if (!errorDiv.classList.contains('show')) {
                errorDiv.textContent = '';
            }
        }, 300);
    }

    // 重置表單和錯誤訊息
    function resetForms() {
        loginForm.reset();
        registerForm.reset();
        hideError('loginError');
        hideError('registerError');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    }

    // 檢查登入狀態
    async function checkLoginStatus() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                updateNavigation(false);
                return;
            }

            const response = await fetch('/api/user/auth', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.data === null) {
                localStorage.removeItem('token');
                updateNavigation(false);
            } else {
                updateNavigation(true, data.data);
            }
        } catch (error) {
            console.error('檢查登入狀態時發生錯誤:', error);
            updateNavigation(false);
        }
    }

    // 更新導航欄顯示
    function updateNavigation(isLoggedIn, userData = null) {
        if (isLoggedIn && userData) {
            loginLink.textContent = '登出系統';
            loginLink.onclick = handleLogout;
            loginLink.href = '#';
        } else {
            loginLink.textContent = '登入/註冊';
            loginLink.onclick = function (e) {
                e.preventDefault();
                authModal.style.display = 'block';
                setTimeout(() => {
                    authModal.classList.add('show');
                }, 10);
                resetForms();
            };
            loginLink.href = '#';
        }
    }

    // 處理登出
    function handleLogout(e) {
        e.preventDefault();

        document.body.classList.add('logging-out');

        authModal.setAttribute('aria-hidden', 'true');
        authModal.style.display = 'none';

        localStorage.removeItem('token');

        setTimeout(() => {
            location.reload();
        }, 50);
    }

    // 處理註冊
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showError('registerError', data.message);
                return;
            }

            showError('registerError', '註冊成功，請登入系統', true);

            setTimeout(() => {
                registerForm.style.display = 'none';
                loginForm.style.display = 'flex';
                document.getElementById('loginEmail').value = email;
                hideError('registerError');
            }, 1500);

        } catch (error) {
            showError('registerError', '系統錯誤，請稍後再試');
        }
    });

    // 處理登入
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/user/auth', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showError('loginError', data.message);
                return;
            }

            localStorage.setItem('token', data.token);
            authModal.classList.remove('show');
            setTimeout(() => {
                authModal.style.display = 'none';
                resetForms();
                location.reload();
            }, 300);

        } catch (error) {
            showError('loginError', '系統錯誤，請稍後再試');
        }
    });

    // 事件監聽器
    openAuthModal?.addEventListener("click", function (e) {
        e.preventDefault();
        authModal.style.display = 'block';
        setTimeout(() => {
            authModal.classList.add('show');
        }, 10);
    });

    closeModal?.addEventListener('click', function () {
        authModal.classList.remove('show');
        setTimeout(() => {
            authModal.style.display = 'none';
            resetForms();
        }, 300);
    });

    window.addEventListener('click', function (e) {
        if (e.target === authModal) {
            authModal.classList.remove('show');
            setTimeout(() => {
                authModal.style.display = 'none';
                resetForms();
            }, 300);
        }
    });

    showRegister?.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        hideError('loginError');
    });

    showLogin?.addEventListener('click', function (e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
        hideError('registerError');
    });

    // 初始檢查登入狀態
    checkLoginStatus();
});