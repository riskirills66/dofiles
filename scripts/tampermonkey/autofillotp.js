(function() {
    // --- CONFIGURATION ---
    // Set these via loader flags or edit directly for static credentials
    const AUTO_REDIRECT_TO_ADM = typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.disableAutoRedirectToADM !== 'undefined' ? !unsafeWindow.disableAutoRedirectToADM : true;
    const AUTO_ADMIN_LOGIN = typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.disableAutoAdminLogin !== 'undefined' ? !unsafeWindow.disableAutoAdminLogin : true;
    // Optionally set credentials here (or inject via loader)
    const ADMIN_USERNAME = (typeof unsafeWindow !== 'undefined' && unsafeWindow.adminUsername) || '';
    const ADMIN_PASSWORD = (typeof unsafeWindow !== 'undefined' && unsafeWindow.adminPassword) || '';
    // OTP API URL flag
    const OTP_API_URL = (typeof unsafeWindow !== 'undefined' && unsafeWindow.otpApiUrl) || "http://10.0.2.20:8040/onetimepass";

    // Helper: get current path
    function getPath() {
        return window.location.pathname;
    }

    // Auto-redirect to /adm if not already there
    if (AUTO_REDIRECT_TO_ADM && !getPath().startsWith('/adm')) {
        window.location.href = '/adm';
        return; // Stop further script execution until redirected
    }

    // On /adm page, autofill and submit login form if credentials are provided
    if (AUTO_ADMIN_LOGIN && getPath().startsWith('/adm') && ADMIN_USERNAME && ADMIN_PASSWORD) {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', function() {
            // Try to find username and password fields
            const userInput = document.querySelector('input[name="username"], input#username');
            const passInput = document.querySelector('input[name="password"], input#password');
            const loginBtn = document.querySelector('button[type="submit"], button.btn-primary, button:contains("Login")');
            if (userInput && passInput) {
                userInput.value = ADMIN_USERNAME;
                passInput.value = ADMIN_PASSWORD;
                userInput.dispatchEvent(new Event('input', { bubbles: true }));
                passInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (loginBtn) {
                    setTimeout(() => loginBtn.click(), 200); // Small delay for UI
                }
            }
        });
    }
})();

(function() {
    'use strict';

    // Flag to track if OTP has been submitted already
    let otpSubmitted = false;

    // Helper function to find elements by text content (similar to jQuery :contains)
    function findElementsByText(selector, text) {
        return Array.from(document.querySelectorAll(selector))
            .filter(el => el.textContent.includes(text));
    }

    // Function to extract the OTP code from the message
    function extractOTPCode(message) {
        // Regular expression to find a 6-digit number in the message
        const otpRegex = /(\d{6})/;
        const match = message.match(otpRegex);

        if (match && match[1]) {
            return match[1];
        }
        return null;
    }

    // Function to fetch OTP from the local server
    function fetchOTP(retryCount = 0) {
        const MAX_RETRIES = 3;

        return new Promise((resolve, reject) => {
            if (retryCount >= MAX_RETRIES) {
                reject(`Exceeded maximum retry attempts (${MAX_RETRIES})`);
                return;
            }

            GM_xmlhttpRequest({
                method: "GET",
                url: OTP_API_URL, // <-- Use the flag here
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

                            // Check if OTP is fresh (less than 5 seconds old)
                            if (timeDiffSeconds <= 5) {
                                const otpCode = extractOTPCode(otpMessage);
                                if (otpCode) {
                                    resolve(otpCode);
                                } else {
                                    reject("OTP code not found in the message");
                                }
                            } else {
                                console.log(`OTP is ${timeDiffSeconds.toFixed(1)} seconds old, retrying to get fresh OTP...`);
                                // Retry after a short delay
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
                    if (retryCount < MAX_RETRIES - 1) {
                        console.log(`Request timed out, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
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
        });
    }

    // Function to fill the OTP input and click submit button
    function fillOTPAndSubmit(otpCode) {
        const otpInput = document.querySelector('input[name="otp"]');
        if (!otpInput) return false;

        // Fill the input with OTP code
        otpInput.value = otpCode;

        // Trigger input event to notify any listeners
        const inputEvent = new Event('input', { bubbles: true });
        otpInput.dispatchEvent(inputEvent);

        // Find the submit button (assuming it's next to the OTP input)
        // Try different methods to find the button
        let submitButton = null;

        // Method 1: If it has a specific ID or text - Based on your screenshot
        submitButton = findElementsByText('button', 'SUBMIT')[0] ||
                       findElementsByText('.btn', 'SUBMIT')[0];

        // Method 2: If it's a sibling or nearby element
        if (!submitButton) {
            let parent = otpInput.parentElement;
            submitButton = parent.querySelector('button[type="submit"]');
        }

        // Method 3: If it's not found, look for a button in the form
        if (!submitButton) {
            const form = otpInput.closest('form');
            if (form) {
                submitButton = form.querySelector('button[type="submit"]');
            }
        }

        // Method 4: Look for a button with common submit text
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
            console.log('Found submit button, clicking...');
            submitButton.click();
            otpSubmitted = true; // Mark as submitted once we click the submit button
            return true;
        }

        console.warn('Submit button not found, looking for it by text content');
        // Last resort - find by text content in any element
        const submitElements = findElementsByText('*', 'SUBMIT').filter(el => el.textContent.trim() === 'SUBMIT');
          if (submitElements.length > 0) {
            console.log('Found submit element by text content, clicking...');
            submitElements[0].click();
            otpSubmitted = true; // Mark as submitted once we click the submit button
            return true;
        }

        return false;
    }
      // Function removed - "Kirim OTP ke saya" functionality has been removed

    // Function to add "Fill OTP" button next to the input field
    function addFillOTPButton(otpInput) {
        // Check if button already exists
        if (document.getElementById('fillOTPButton')) {
            return;
        }
          // Create button element
        const fillButton = document.createElement('button');
        fillButton.id = 'fillOTPButton';
        fillButton.textContent = 'Fill & Submit OTP';
        fillButton.className = 'btn btn-primary btn-sm';
        fillButton.style.marginLeft = '5px';
        fillButton.style.marginTop = '5px';
        fillButton.style.padding = '3px 10px';
          // Add click event listener
        fillButton.addEventListener('click', function(e) {
            e.preventDefault();

            // Show loading state
            const originalText = fillButton.textContent;
            fillButton.textContent = 'Loading...';
            fillButton.disabled = true;

            // Fetch and fill OTP
            fetchOTP()
                .then(otpCode => {
                    console.log('Fresh OTP code retrieved:', otpCode);

                    // Fill the input with OTP code and submit
                    const success = fillOTPAndSubmit(otpCode);

                    // Reset button (this may not be visible if submission was successful)
                    fillButton.textContent = success ? 'Submitted' : originalText;
                    fillButton.disabled = false;

                    if (!success) {
                        console.error('Failed to find submit button');
                    }
                })
                .catch(error => {
                    console.error('Error handling OTP:', error);
                    fillButton.textContent = 'Error';
                    setTimeout(() => {
                        fillButton.textContent = originalText;
                        fillButton.disabled = false;
                    }, 1500);
                });
        });

        // Insert button after the OTP input, on its right side
        if (otpInput.parentNode) {
            // Check if input is in a container
            const inputContainer = otpInput.parentNode;

            // Insert button right after the input
            if (otpInput.nextSibling) {
                inputContainer.insertBefore(fillButton, otpInput.nextSibling);
            } else {
                inputContainer.appendChild(fillButton);            }
        }
    }    // Function to check for and click the "Kirim OTP ke saya" button
    // Then automatically fetch and fill OTP after a delay
    // Only runs once until page refresh
    function clickKirimOTPButton() {
        // Don't proceed if OTP has already been submitted
        if (otpSubmitted) {
            return false;
        }

        // Look for the specific button with the ID and text
        const kirimButton = document.querySelector('a#kirimotp.btn.btn-outline-primary');

        // If the button is not found by ID, try to find it by text content
        let button = kirimButton;
        if (!button) {
            button = findElementsByText('a.btn', 'Kirim OTP ke saya')[0];
        }

        // If the button is found, click it
        if (button) {
            console.log('Found "Kirim OTP ke saya" button, clicking...');
            button.click();

            // Disable the button from being clicked again
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';

            // After clicking the button, wait 1 second and then auto-fill OTP
            // EDIT THIS VALUE to change how long to wait after clicking the button before getting the OTP
            const waitTimeAfterButtonClickMs = 200; // 1000ms = 1 second

            setTimeout(() => {
                if (!otpSubmitted) {  // Double-check we haven't submitted yet
                    console.log('Auto-fetching OTP after clicking the button...');
                    fetchOTP()
                        .then(otpCode => {
                            console.log('Fresh OTP code retrieved:', otpCode);

                            // Fill the input with OTP code and submit
                            const success = fillOTPAndSubmit(otpCode);

                            if (!success) {
                                console.error('Failed to find submit button');
                            } else {
                                console.log('Successfully auto-filled and submitted OTP');
                                // Mark as submitted to prevent further attempts
                                otpSubmitted = true;

                                // Clear any periodic checks
                                if (window.otpCheckInterval) {
                                    clearInterval(window.otpCheckInterval);
                                    window.otpCheckInterval = null;
                                    console.log('Disabled periodic OTP checks - task completed');
                                }
                            }
                        })
                        .catch(error => {
                            console.error('Error handling OTP:', error);
                            // Don't mark as submitted if there was an error
                        });
                }
            }, waitTimeAfterButtonClickMs); // Wait 1 second

            return true;
        }

        return false;
    }// Main function that checks for OTP input field and "Kirim OTP ke saya" button
    function processOTPInput() {
        // Check if the OTP input field exists
        const otpInput = document.querySelector('input[name="otp"]#exampleInputPassword');

        if (otpInput) {
            // Disconnect the observer since we've found the input
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }

        // Check and click "Kirim OTP ke saya" button if it exists
        // This will automatically trigger OTP fetch, fill and submit
        clickKirimOTPButton();
    }

    // Setup MutationObserver to watch for the OTP input
    let observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                processOTPInput();
            }
        }
    });    // Start observing the document
    observer.observe(document, { childList: true, subtree: true });

    // Also check immediately in case the element is already present
    processOTPInput();

    // Reset flag when page is unloaded (e.g., on refresh)
    window.addEventListener('beforeunload', () => {
        otpSubmitted = false;
    });

    // Set up a periodic check for the "Kirim OTP ke saya" button
    // This is helpful in case the button appears after page loads or during interactions
    // When button is found, it will automatically click it, wait 1 second, then fill & submit the OTP
    window.otpCheckInterval = setInterval(() => {
        // If we've already submitted the OTP, stop checking
        if (otpSubmitted) {
            clearInterval(window.otpCheckInterval);
            window.otpCheckInterval = null;
            console.log('Disabled periodic OTP checks - task completed');
            return;
        }

        const clicked = clickKirimOTPButton();
        // If button was clicked and OTP process started, we can reduce the check frequency
        if (clicked) {
            console.log('Button click initiated - reducing check frequency');
        }
    }, 2000); // Check every 2 seconds
})();