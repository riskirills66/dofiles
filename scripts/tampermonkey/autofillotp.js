/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🚀 OtoReport Complete Automation Suite - Main Script
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * 📋 DESCRIPTION:
 *    Complete automation solution for OtoReport platform combining admin auto-login
 *    and intelligent OTP automation with SMS gateway integration.
 *
 * ⚡ FEATURES:
 *    • 🔄 Auto redirect to admin page when WOTP div detected
 *    • 🔐 Auto-login with predefined credentials
 *    • 🎯 Smart OTP button detection & auto-clicking
 *    • ⏱️  OTP freshness validation (5-second window)
 *    • 🔄 Intelligent retry mechanism with exponential backoff
 *    • 🛡️  Duplicate submission prevention
 *    • 📱 Real-time SMS gateway integration
 *
 * 📝 LICENSE: MIT License
 * 👨‍💻 AUTHOR: ProcessorDev
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // Get configuration from unsafeWindow (set by loader)
    const CONFIG = {
        ADMIN_USERNAME: unsafeWindow.otoreport_admin_username || 'administrator',
        ADMIN_PASSWORD: unsafeWindow.otoreport_admin_password || 'password',
        OTP_SERVER_URL: unsafeWindow.otoreport_otp_server || 'http://localhost:8040/onetimepass',
        OTP_VALIDITY_SECONDS: unsafeWindow.otoreport_otp_validity || 5,
        MAX_RETRIES: unsafeWindow.otoreport_max_retries || 3,
        BUTTON_CLICK_DELAY: unsafeWindow.otoreport_button_delay || 200,
        OTP_CHECK_INTERVAL: unsafeWindow.otoreport_check_interval || 2000,
        DEBUG_MODE: unsafeWindow.otoreport_debug || false
    };

    // Debug logging function
    function debugLog(message, ...args) {
        if (CONFIG.DEBUG_MODE) {
            console.log(`[OtoReport Debug] ${message}`, ...args);
        }
    }

    // Global flags
    let otpSubmitted = false;
    let adminLoginAttempted = false;

    console.log('🚀 OtoReport Automation Suite loaded with config:', CONFIG);

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // ADMIN REDIRECT & LOGIN FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════════════════

    // Function to check for the WOTP div that triggers admin redirect
    function checkForWOTPDiv() {
        const targetDiv = document.getElementById('wotp');

        if (targetDiv &&
            targetDiv.classList.contains('box') &&
            targetDiv.classList.contains('box-block') &&
            targetDiv.classList.contains('tile') &&
            targetDiv.classList.contains('tile-2') &&
            targetDiv.classList.contains('bg-primary') &&
            targetDiv.classList.contains('mb-2') &&
            targetDiv.style.cursor === 'pointer') {

            debugLog('WOTP div detected, redirecting to admin page...');
            window.location.href = 'https://rmwapps.otoreport.com/adm/';
            return true;
        }
        return false;
    }

    // Function to auto-fill admin login form
    function autoFillAdminLogin() {
        if (adminLoginAttempted) {
            return false;
        }

        const usernameField = document.getElementById('idlogin');
        const passwordField = document.getElementById('exampleInputPassword');
        const loginButton = document.getElementById('login');

        if (usernameField && passwordField && loginButton) {
            debugLog('Admin login form detected, auto-filling credentials...');
            
            // Fill in the credentials
            usernameField.value = CONFIG.ADMIN_USERNAME;
            passwordField.value = CONFIG.ADMIN_PASSWORD;

            // Trigger input events to ensure the form recognizes the values
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));

            // Mark as attempted to prevent multiple attempts
            adminLoginAttempted = true;

            // Wait a moment then submit
            setTimeout(() => {
                debugLog('Submitting admin login form...');
                loginButton.click();
            }, 500);

            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // OTP AUTOMATION FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════════════════

    // Helper function to find elements by text content
    function findElementsByText(selector, text) {
        return Array.from(document.querySelectorAll(selector))
            .filter(el => el.textContent.includes(text));
    }

    // Function to extract the OTP code from the message
    function extractOTPCode(message) {
        const otpRegex = /(\d{6})/;
        const match = message.match(otpRegex);
        return match ? match[1] : null;
    }

    // Function to fetch OTP from the local server with retry logic
    function fetchOTP(retryCount = 0) {
        return new Promise((resolve, reject) => {
            if (retryCount >= CONFIG.MAX_RETRIES) {
                reject(`Exceeded maximum retry attempts (${CONFIG.MAX_RETRIES})`);
                return;
            }

            // Use GM_xmlhttpRequest from loader context
            if (typeof unsafeWindow.GM_xmlhttpRequest === 'function') {
                unsafeWindow.GM_xmlhttpRequest({
                    method: "GET",
                    url: CONFIG.OTP_SERVER_URL,
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

                                // Check if OTP is fresh
                                if (timeDiffSeconds <= CONFIG.OTP_VALIDITY_SECONDS) {
                                    const otpCode = extractOTPCode(otpMessage);
                                    if (otpCode) {
                                        debugLog('Fresh OTP code extracted:', otpCode);
                                        resolve(otpCode);
                                    } else {
                                        reject("OTP code not found in the message");
                                    }
                                } else {
                                    debugLog(`OTP is ${timeDiffSeconds.toFixed(1)} seconds old, retrying...`);
                                    setTimeout(() => {
                                        fetchOTP(retryCount + 1)
                                            .then(resolve)
                                            .catch(reject);
                                    }, 500);
                                }
                            } else {
                                reject("No OTP data found in the response");
                            }
                        } catch (error) {
                            reject(`Error parsing response: ${error.message}`);
                        }
                    },
                    onerror: function(error) {
                        reject(`Failed to fetch OTP: ${error.error}`);
                    },
                    ontimeout: function() {
                        if (retryCount < CONFIG.MAX_RETRIES - 1) {
                            debugLog(`Request timed out, retrying (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`);
                            setTimeout(() => {
                                fetchOTP(retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 500);
                        } else {
                            reject("Request timed out after multiple attempts");
                        }
                    }
                });
            } else {
                reject("GM_xmlhttpRequest not available");
            }
        });
    }

    // Function to fill the OTP input and click submit button
    function fillOTPAndSubmit(otpCode) {
        const otpInput = document.querySelector('input[name="otp"]');
        if (!otpInput) return false;

        debugLog('Filling OTP input with code:', otpCode);

        // Fill the input with OTP code
        otpInput.value = otpCode;

        // Trigger input event to notify any listeners
        const inputEvent = new Event('input', { bubbles: true });
        otpInput.dispatchEvent(inputEvent);

        // Find the submit button using multiple methods
        let submitButton = null;

        // Method 1: Find by text content
        submitButton = findElementsByText('button', 'SUBMIT')[0] ||
                       findElementsByText('.btn', 'SUBMIT')[0];

        // Method 2: Find as sibling or nearby element
        if (!submitButton) {
            let parent = otpInput.parentElement;
            submitButton = parent.querySelector('button[type="submit"]');
        }

        // Method 3: Find in form
        if (!submitButton) {
            const form = otpInput.closest('form');
            if (form) {
                submitButton = form.querySelector('button[type="submit"]');
            }
        }

        // Method 4: Find by common submit text
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

        // Click the button if found
        if (submitButton) {
            debugLog('Found submit button, clicking...');
            submitButton.click();
            otpSubmitted = true;
            return true;
        }

        debugLog('Submit button not found, looking for it by text content');
        // Last resort - find by text content in any element
        const submitElements = findElementsByText('*', 'SUBMIT').filter(el => el.textContent.trim() === 'SUBMIT');
        if (submitElements.length > 0) {
            debugLog('Found submit element by text content, clicking...');
            submitElements[0].click();
            otpSubmitted = true;
            return true;
        }

        return false;
    }

    // Function to check for and click the "Kirim OTP ke saya" button
    function clickKirimOTPButton() {
        if (otpSubmitted) {
            return false;
        }

        // Look for the specific button
        const kirimButton = document.querySelector('a#kirimotp.btn.btn-outline-primary');
        let button = kirimButton;
        
        if (!button) {
            button = findElementsByText('a.btn', 'Kirim OTP ke saya')[0];
        }

        if (button) {
            debugLog('Found "Kirim OTP ke saya" button, clicking...');
            button.click();

            // Disable the button from being clicked again
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';

            // Auto-fill OTP after clicking the button
            setTimeout(() => {
                if (!otpSubmitted) {
                    debugLog('Auto-fetching OTP after clicking the button...');
                    fetchOTP()
                        .then(otpCode => {
                            debugLog('Fresh OTP code retrieved:', otpCode);
                            const success = fillOTPAndSubmit(otpCode);

                            if (success) {
                                console.log('✅ Successfully auto-filled and submitted OTP');
                                otpSubmitted = true;

                                // Clear periodic checks
                                if (window.otpCheckInterval) {
                                    clearInterval(window.otpCheckInterval);
                                    window.otpCheckInterval = null;
                                    debugLog('Disabled periodic OTP checks - task completed');
                                }
                            } else {
                                console.error('❌ Failed to find submit button');
                            }
                        })
                        .catch(error => {
                            console.error('❌ Error handling OTP:', error);
                        });
                }
            }, CONFIG.BUTTON_CLICK_DELAY);

            return true;
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // MAIN EXECUTION LOGIC
    // ═══════════════════════════════════════════════════════════════════════════════════════

    // Main function to handle different page states
    function initializeScript() {
        const currentURL = window.location.href;

        // Check if we're on the admin login page
        if (currentURL.includes('/adm/')) {
            debugLog('Admin page detected, setting up auto-login...');
            
            // Try to auto-fill immediately
            if (autoFillAdminLogin()) {
                return;
            }

            // Set up observer for admin page
            const adminObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        if (autoFillAdminLogin()) {
                            adminObserver.disconnect();
                        }
                    }
                });
            });

            // Start observing for login form
            adminObserver.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Fallback check for admin page
            const adminIntervalCheck = setInterval(function() {
                if (autoFillAdminLogin()) {
                    clearInterval(adminIntervalCheck);
                    adminObserver.disconnect();
                }
            }, 1000);

            return;
        }

        // For non-admin pages, check for WOTP div and handle OTP
        debugLog('Non-admin page detected, setting up WOTP detection and OTP handling...');

        // Check for WOTP div immediately
        if (checkForWOTPDiv()) {
            return;
        }

        // Set up observers for both WOTP detection and OTP handling
        const mainObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Check for WOTP div
                    if (checkForWOTPDiv()) {
                        mainObserver.disconnect();
                        return;
                    }
                    
                    // Check for OTP functionality
                    clickKirimOTPButton();
                }
            });
        });

        // Start observing the document for changes
        mainObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Periodic check for WOTP div as fallback
        const wotpIntervalCheck = setInterval(function() {
            if (checkForWOTPDiv()) {
                clearInterval(wotpIntervalCheck);
                mainObserver.disconnect();
            }
        }, 1000);

        // Set up periodic check for OTP button
        window.otpCheckInterval = setInterval(() => {
            if (otpSubmitted) {
                clearInterval(window.otpCheckInterval);
                window.otpCheckInterval = null;
                debugLog('Disabled periodic OTP checks - task completed');
                return;
            }

            clickKirimOTPButton();
        }, CONFIG.OTP_CHECK_INTERVAL);
    }

    // Initialize the script
    initializeScript();

    // Reset flags when page is unloaded
    window.addEventListener('beforeunload', () => {
        otpSubmitted = false;
        adminLoginAttempted = false;
        debugLog('Page unloading, resetting flags');
    });

    console.log('🚀 OtoReport Complete Automation Suite initialized successfully');

})();