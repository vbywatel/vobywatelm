(function () {
  'use strict';

  window.BiometricAuth = {
    isAvailable: function () {
      return window.PublicKeyCredential !== undefined;
    },

    checkPlatformSupport: async function () {
      if (!this.isAvailable()) return false;
      try {
        // Sprawdza czy urządzenie w ogóle posiada czytnik
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (e) { return false; }
    },

    isRegistered: function () {
      return localStorage.getItem('biometric_registered') === 'true';
    },

    register: async function () {
      try {
        // SYMULACJA DLA GITHUB PAGES:
        // Prawdziwy WebAuthn na .github.io często rzuca SecurityError.
        // Jeśli chcesz tylko efektu wizualnego, użyjemy "sztucznej" rejestracji:
        
        console.log('[BiometricAuth] Symulacja rejestracji...');
        
        // Zapisujemy, że biometria jest aktywna
        localStorage.setItem('biometric_registered', 'true');
        localStorage.setItem('userPasswordHash', 'zalogowano_automatycznie');
        
        return true; 
      } catch (error) {
        console.error('[BiometricAuth] Błąd:', error);
        throw error;
      }
    },

    authenticate: async function () {
      // Przy logowaniu od razu wpuszczamy użytkownika
      sessionStorage.setItem('userUnlocked', '1');
      sessionStorage.setItem('auth_validated', 'true');
      return true;
    },

    unregister: function () {
      localStorage.removeItem('biometric_registered');
      return true;
    }
  };
})();
