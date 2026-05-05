/**
 * Biometric Authentication Module for xObywatel
 * Ostateczna wersja z wymuszonym skracaniem User ID
 */

(function () {
  'use strict';

  window.BiometricAuth = {
    isAvailable: function () {
      return (
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      );
    },

    checkPlatformSupport: async function () {
      if (!this.isAvailable()) return false;
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch (error) {
        console.error('[BiometricAuth] Error checking support:', error);
        return false;
      }
    },

    isRegistered: function () {
      return localStorage.getItem('biometric_registered') === 'true';
    },

    register: async function () {
      if (!this.isAvailable()) throw new Error('Biometric not available');

      try {
        const passwordHash = localStorage.getItem('userPasswordHash') || 'default_hash';
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        // WYMUSZENIE KRÓTKIEGO ID (Max 64 bytes)
        const userId = await this._getSafeUserId();

        const publicKeyOptions = {
          challenge: challenge,
          rp: {
            name: 'xObywatel',
            id: 'vbywatel.github.io'
          },
          user: {
            // Konwertujemy Hex na Buffer - to gwarantuje mały rozmiar bajtowy
            id: this._hexToBuffer(userId),
            name: 'user@xobywatel',
            displayName: 'Użytkownik xObywatel'
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        };

        console.log('[BiometricAuth] Wywołuję systemowe okno rejestracji...');
        const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

        if (!credential) throw new Error('Failed to create credential');

        const credentialData = {
          id: credential.id,
          rawId: this._bufferToBase64(credential.rawId),
          type: credential.type,
          passwordHash: passwordHash
        };

        localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
        localStorage.setItem('biometric_registered', 'true');
        return true;
      } catch (error) {
        console.error('[BiometricAuth] Registration error:', error);
        throw error;
      }
    },

    authenticate: async function () {
      if (!this.isRegistered()) throw new Error('Not registered');

      try {
        const credentialData = JSON.parse(localStorage.getItem('biometric_credential'));
        const challenge = crypto.getRandomValues(new Uint8Array(32));

        const publicKeyOptions = {
          challenge: challenge,
          rpId: 'vbywatel.github.io',
          allowCredentials: [{
            type: 'public-key',
            id: this._base64ToBuffer(credentialData.rawId),
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        };

        const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
        if (!assertion) throw new Error('Authentication failed');

        sessionStorage.setItem('userUnlocked', '1');
        return credentialData.passwordHash;
      } catch (error) {
        console.error('[BiometricAuth] Auth error:', error);
        throw error;
      }
    },

    // --- NOWA FUNKCJA GENERUJĄCA BEZPIECZNE ID ---
    _getSafeUserId: async function () {
      let id = localStorage.getItem('biometric_user_id');
      
      // Jeśli ID jest za długie (stary błąd) lub go nie ma - generujemy nowe, krótkie
      if (!id || id.length > 32) {
        const randomBytes = new Uint8Array(16); // 16 bajtów to bezpieczny standard
        crypto.getRandomValues(randomBytes);
        id = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('biometric_user_id', id);
      }
      return id;
    },

    _hexToBuffer: function (hex) {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return bytes.buffer;
    },

    _bufferToBase64: function (buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },

    _base64ToBuffer: function (base64) {
      const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }
  };
})();
