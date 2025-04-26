export function showError(elementId, message, isSuccess = false) {
  const errorDiv = document.getElementById(elementId);
  errorDiv.textContent = message;
  errorDiv.style.color = isSuccess ? '#32c273' : '#D20B2E';
  errorDiv.classList.add('show');

  if (!isSuccess) {
    setTimeout(() => hideError(elementId), 2000);
  }
}

export function hideError(elementId) {
  const errorDiv = document.getElementById(elementId);
  if (!errorDiv) return;

  errorDiv.classList.add('fade-out');

  errorDiv.addEventListener('transitionend', function handleTransitionEnd() {
    if (errorDiv.classList.contains('fade-out')) {
      errorDiv.classList.remove('show', 'fade-out');
      errorDiv.textContent = '';
    }
    errorDiv.removeEventListener('transitionend', handleTransitionEnd);
  });
}

export function resetForms(loginForm, registerForm) {
  loginForm.reset();
  registerForm.reset();
  hideError('loginError');
  hideError('registerError');
  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';
}

export function switchToRegister(loginForm, registerForm) {
  loginForm.style.display = 'none';
  registerForm.style.display = 'flex';
  hideError('loginError');
}

export function switchToLogin(registerForm, loginForm) {
  registerForm.style.display = 'none';
  loginForm.style.display = 'flex';
  hideError('registerError');
}

export function bindCloseModalEvents(authModal, loginForm, registerForm) {
  const closeModal = document.getElementById('closeModal');

  // 關閉按鈕
  closeModal?.addEventListener('click', () => {
    authModal.classList.remove("show");
    setTimeout(() => {
      authModal.style.display = "none";
      resetForms(loginForm, registerForm);
    }, 300);
  });

  // 背景區塊關閉
  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.classList.remove("show");
      setTimeout(() => {
        authModal.style.display = "none";
        resetForms(loginForm, registerForm);
      }, 300);
    }
  });
}