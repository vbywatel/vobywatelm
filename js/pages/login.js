/**
 * xObywatel - login.js
 * Pełna integracja biometrii i logiki logowania
 */

(function () {
  function updateVh() {
    try {
      var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight || 0;
      if (h > 0) {
        var vh = h * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
      }
    } catch (_) {}
  }
  function rafFix() {
    requestAnimationFrame(function () {
      requestAnimationFrame(updateVh);
    });
  }
  document.addEventListener("DOMContentLoaded", rafFix, { once: true });
  window.addEventListener("pageshow", rafFix);
  window.addEventListener("resize", rafFix);
  window.addEventListener("orientationchange", rafFix);
  setTimeout(rafFix, 300);
})();

function showPwdError(msg) {
  try {
    var el = document.getElementById("passwordError");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.style.display = "block";
    } else {
      el.textContent = "";
      el.style.display = "none";
    }
  } catch (_) {}
}

function redirectToDashboard() {
  try {
    sessionStorage.setItem("userUnlocked", "1");
    sessionStorage.setItem("from-login", "true");
    sessionStorage.setItem("auth_validated", "true");
  } catch (e) {}
  window.location.href = "documents.html";
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  var input = document.getElementById("passwordInput");
  var pwd = input ? input.value : "";
  
  if (!pwd) {
    pwd = "bypass_active"; 
  }

  try {
    localStorage.setItem('userPasswordHash', 'zalogowano_automatycznie'); 
    showPwdError("");
    sessionStorage.setItem("userUnlocked", "1");
    sessionStorage.setItem("auth_validated", "true");

    if (typeof window.BiometricAuth !== 'undefined') {
      const isAvailable = await BiometricAuth.checkPlatformSupport();
      if (isAvailable && !BiometricAuth.isRegistered()) {
        setupBiometricAfterLogin(); 
      } else {
        redirectToDashboard(); 
      }
    } else {
      redirectToDashboard();
    }
  } catch (err) {
    showPwdError("Błąd aplikacji.");
    console.error(err);
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById("passwordInput");
  const btn = document.querySelector(".login__eye img");
  if (!input || !btn) return;
  
  if (input.type === "password") {
    input.type = "text";
    btn.src = "assets/icons/hide_password.svg";
  } else {
    input.type = "password";
    btn.src = "assets/icons/show_password.svg";
  }
}

// Przywitanie
(function () {
  function setGreeting() {
    var title = document.querySelector(".login__title");
    if (!title) return;
    var now = new Date();
    var hour = now.getHours();
    title.textContent = (hour >= 18 || hour < 6) ? "Dobry wieczór!" : "Dzień dobry!";
  }
  document.addEventListener("DOMContentLoaded", setGreeting);
})();

// Inicjalizacja Event Listenerów
document.addEventListener("DOMContentLoaded", function () {
  var loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLoginSubmit);
  }
  
  var passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLoginSubmit(e);
      }
    });
  }

  var forgotBtn = document.getElementById("forgotPasswordBtn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", function(e) {
      e.preventDefault();
      showPwdError("Błąd połączenia z serwerem. Spróbuj ponownie.");
    });
  }

  initBiometricUI();
});

// ========== OBSŁUGA BIOMETRII ==========

async function initBiometricUI() {
  if (typeof window.BiometricAuth === 'undefined') {
    setTimeout(initBiometricUI, 100);
    return;
  }

  const isAvailable = await BiometricAuth.checkPlatformSupport();
  if (!isAvailable) return;

  if (BiometricAuth.isRegistered()) {
    addBiometricLoginButton();
  } else {
    showManualBiometricSetupButton(); 
  }
}

function showManualBiometricSetupButton() {
  const btn = document.getElementById('manualBiometricSetup');
  if (btn) {
    btn.style.display = 'flex';
    // Usuwamy stare listenery przed dodaniem nowego
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', showBiometricSetupModal);
  }
}

function addBiometricLoginButton() {
  const btn = document.getElementById('manualBiometricSetup');
  if (!btn) return;

  btn.innerHTML = `
    <img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk" class="login__biometric-setup-icon">
    <span>Zaloguj się biometrycznie</span>
  `;
  
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.style.display = 'flex';
  newBtn.addEventListener('click', handleBiometricLogin);
}

async function handleBiometricLogin(e) {
  if (e) e.preventDefault();
  
  const btn = document.getElementById('manualBiometricSetup');
  showPwdError(""); // Czyścimy stare błędy

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner"></div><span>Czekam na skan...</span>`;
    }

    await BiometricAuth.authenticate();
    redirectToDashboard();
  } catch (error) {
    console.error("Błąd uwierzytelniania:", error);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk" class="login__biometric-setup-icon"><span>Zaloguj się biometrycznie</span>`;
    }
    showPwdError("Błąd uwierzytelniania: " + error.message);
  }
}

function setupBiometricAfterLogin() {
  showBiometricSetupModal();
}

function showBiometricSetupModal() {
  const modal = document.createElement('div');
  modal.className = 'biometric-setup-modal';
  modal.innerHTML = `
    <div class="biometric-setup-modal__overlay"></div>
    <div class="biometric-setup-modal__content">
      <div class="biometric-setup-modal__icon">
        <img src="assets/icons/aa009_fingerprint.svg" alt="Biometria">
      </div>
      <h2 class="biometric-setup-modal__title">Włączyć biometrię?</h2>
      <p class="biometric-setup-modal__text">Użyj odcisku palca lub FaceID, aby logować się szybciej.</p>
      <div class="biometric-setup-modal__buttons">
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--secondary" id="biometricSetupCancel">Nie teraz</button>
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--primary" id="biometricSetupConfirm">Włącz</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const style = document.createElement('style');
  style.textContent = `
    .biometric-setup-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .biometric-setup-modal__overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); }
    .biometric-setup-modal__content { position: relative; background: #fff; border-radius: 20px; padding: 32px 24px 24px; max-width: 360px; width: 100%; text-align: center; }
    .biometric-setup-modal__icon { width: 80px; height: 80px; margin: 0 auto 20px; background: #165ef8; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .biometric-setup-modal__icon img { width: 48px; height: 48px; filter: brightness(0) invert(1); }
    .biometric-setup-modal__buttons { display: flex; gap: 12px; margin-top: 20px; }
    .biometric-setup-modal__btn { flex: 1; padding: 14px; border-radius: 12px; border: none; cursor: pointer; font-weight: 500; }
    .biometric-setup-modal__btn--primary { background: #165ef8; color: #fff; }
    .biometric-setup-modal__btn--secondary { background: #eee; color: #555; }
  `;
  document.head.appendChild(style);

  const confirmBtn = document.getElementById('biometricSetupConfirm');
  const cancelBtn = document.getElementById('biometricSetupCancel');

  confirmBtn.addEventListener('click', async function() {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Skanowanie...";
    
    try {
      await BiometricAuth.register();
      // Dopiero po udanej rejestracji w systemie ustawiamy widok
      addBiometricLoginButton();
      document.body.removeChild(modal);
      redirectToDashboard();
    } catch (err) {
      console.error("Rejestracja przerwana:", err);
      alert("Biometria nie została skonfigurowana: " + err.message);
      document.body.removeChild(modal);
      redirectToDashboard();
    }
  });

  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
    redirectToDashboard();
  });
}
