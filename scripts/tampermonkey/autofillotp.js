(function() {
    'use strict';

    // ========== AUTO-REDIRECT & AUTO-LOGIN ==========
    function checkForWotpDiv() {
        if (window.disableAutoRedirectToADM) return false;
        const targetDiv = document.getElementById('wotp');
        if (targetDiv &&
            targetDiv.classList.contains('box') &&
            targetDiv.classList.contains('box-block') &&
            targetDiv.classList.contains('tile') &&
            targetDiv.classList.contains('tile-2') &&
            targetDiv.classList.contains('bg-primary') &&
            targetDiv.classList.contains('mb-2') &&
            targetDiv.style.cursor === 'pointer') {
            window.location.href = 'https://rmwapps.otoreport.com/adm/';
            return true;
        }
        return false;
    }

    function autofillLogin() {
        if (window.disableAutoAdminLogin) return false;
        const usernameField = document.getElementById('idlogin');
        const passwordField = document.getElementById('exampleinputpassword');
        const loginButton = document.getElementById('login');
        const username = window.adminUsername;
        const password = window.adminPassword;
        if (!username || !password) return false;
        if (usernameField && passwordField && loginButton) {
            usernameField.value = username;
            passwordField.value = password;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
                loginButton.click();
            }, 500);
            return true;
        }
        return false;
    }

    if (window.location.href.includes('/adm/')) {
        if (autofillLogin()) return;
        const adminObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    if (autofillLogin()) {
                        adminObserver.disconnect();
                    }
                }
            });
        });
        adminObserver.observe(document.body, { childList: true, subtree: true });
        const adminIntervalCheck = setInterval(function() {
            if (autofillLogin()) {
                clearInterval(adminIntervalCheck);
                adminObserver.disconnect();
            }
        }, 1000);
        // Continue to OTP logic below
    } else {
        if (checkForWotpDiv()) return;
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    checkForWotpDiv();
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        const intervalCheck = setInterval(function() {
            if (checkForWotpDiv()) {
                clearInterval(intervalCheck);
                observer.disconnect();
            }
        }, 1000);
    }

    // ========== OTP AUTO-FILLER ==========
    let otpSubmitted = false;

    function findElementsByText(selector, text) {
        return Array.from(document.querySelectorAll(selector))
            .filter(el => el.textContent.includes(text));
    }

    function extractOTPCode(message) {
        const otpRegex = /(\d{6})/;
        const match = message.match(otpRegex);
        return match && match[1] ? match[1] : null;
    }

    function fetchOTP(retryCount = 0) {
        const MAX_RETRIES = 3;
        const apiUrl = window.otpApiUrl;
        if (!apiUrl) return Promise.reject('No otpApiUrl set');
        return new Promise((resolve, reject) => {
            if (retryCount >= MAX_RETRIES) {
                reject(`Exceeded maximum retry attempts (${MAX_RETRIES})`);
                return;
            }
            if (typeof GM_xmlhttpRequest !== 'function') {
                reject('GM_xmlhttpRequest is not available.');
                return;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                timeout: 5000,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.onetimepass && data.onetimepass.length > 0) {
                            const otpData = data.onetimepass[0];
                            const otpMessage = otpData.pesan;
                            const otpDate = new Date(otpData.tgl_entri);
                            const currentDate = new Date();
                            const timeDiffSeconds = (currentDate - otpDate) / 1000;
                            if (timeDiffSeconds <= 5) {
                                const otpCode = extractOTPCode(otpMessage);
                                if (otpCode) {
                                    resolve(otpCode);
                                } else {
                                    reject('OTP code not found in the message');
                                }
                            } else {
                                setTimeout(() => {
                                    fetchOTP(retryCount + 1).then(resolve).catch(reject);
                                }, 500);
                            }
                        } else {
                            reject('No OTP data found in the response');
                        }
                    } catch (error) {
                        reject(`Error parsing response: ${error.message}`);
                    }
                },
                onerror: function(error) {
                    reject(`Failed to fetch OTP: ${error.error}`);
                },
                ontimeout: function() {
                    if (retryCount < MAX_RETRIES - 1) {
                        setTimeout(() => {
                            fetchOTP(retryCount + 1).then(resolve).catch(reject);
                        }, 500);
                    } else {
                        reject('Request timed out after multiple attempts');
                    }
                }
            });
        });
    }

    function fillOTPAndSubmit(otpCode) {
        const otpInput = document.querySelector('input[name="otp"]');
        if (!otpInput) return false;
        otpInput.value = otpCode;
        otpInput.dispatchEvent(new Event('input', { bubbles: true }));
        let submitButton = findElementsByText('button', 'SUBMIT')[0] ||
                           findElementsByText('.btn', 'SUBMIT')[0];
        if (!submitButton) {
            let parent = otpInput.parentElement;
            submitButton = parent ? parent.querySelector('button[type="submit"]') : null;
        }
        if (!submitButton) {
            const form = otpInput.closest('form');
            if (form) {
                submitButton = form.querySelector('button[type="submit"]');
            }
        }
        if (!submitButton) {
            const buttons = document.querySelectorAll('button, .btn');
            for (const button of buttons) {
                const text = button.textContent.toLowerCase();
                if (text.includes('submit') || text.includes('login') ||
                    text.includes('sign in') || text.includes('ok') ||
                    text.includes('masuk') || text.includes('lanjut')) {
                    submitButton = button;
                    break;
                }
            }
        }
        if (submitButton) {
            submitButton.click();
            otpSubmitted = true;
            return true;
        }
        const submitElements = findElementsByText('*', 'SUBMIT').filter(el => el.textContent.trim() === 'SUBMIT');
        if (submitElements.length > 0) {
            submitElements[0].click();
            otpSubmitted = true;
            return true;
        }
        return false;
    }

    function clickKirimOTPButton() {
        if (otpSubmitted) return false;
        const kirimButton = document.querySelector('a#kirimotp.btn.btn-outline-primary');
        let button = kirimButton;
        if (!button) {
            button = findElementsByText('a.btn', 'Kirim OTP ke saya')[0];
        }
        if (button) {
            button.click();
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';
            setTimeout(() => {
                if (!otpSubmitted) {
                    fetchOTP().then(otpCode => {
                        fillOTPAndSubmit(otpCode);
                        otpSubmitted = true;
                        if (window.otpCheckInterval) {
                            clearInterval(window.otpCheckInterval);
                            window.otpCheckInterval = null;
                        }
                    }).catch(() => {});
                }
            }, 200);
            return true;
        }
        return false;
    }

    function processOTPInput() {
        const otpInput = document.querySelector('input[name="otp"]#exampleInputPassword');
        if (otpInput) {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }
        clickKirimOTPButton();
    }

    let observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                processOTPInput();
            }
        }
    });
    observer.observe(document, { childList: true, subtree: true });
    processOTPInput();
    window.addEventListener('beforeunload', () => {
        otpSubmitted = false;
    });
    window.otpCheckInterval = setInterval(() => {
        if (otpSubmitted) {
            clearInterval(window.otpCheckInterval);
            window.otpCheckInterval = null;
            return;
        }
        clickKirimOTPButton();
    }, 2000);

})();
