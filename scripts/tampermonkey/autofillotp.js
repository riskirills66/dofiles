(function () {
  "use strict";

  // Get configuration from unsafeWindow (set by loader)
  const CONFIG = {
    ADMIN_USERNAME: unsafeWindow.otoreport_admin_username || "administrator",
    ADMIN_PASSWORD: unsafeWindow.otoreport_admin_password || "password",
    OTP_SERVER_URL:
      unsafeWindow.otoreport_otp_server || "http://localhost:8040/onetimepass",
    OTP_VALIDITY_SECONDS: unsafeWindow.otoreport_otp_validity || 30, // Increased from 5 to 30 seconds
    MAX_RETRIES: unsafeWindow.otoreport_max_retries || 3,
    BUTTON_CLICK_DELAY: unsafeWindow.otoreport_button_delay || 500, // Set to 500ms
    OTP_CHECK_INTERVAL: unsafeWindow.otoreport_check_interval || 2000,
    DEBUG_MODE: unsafeWindow.otoreport_debug || false,
  };

  // Debug logging function
  function debugLog(message, ...args) {
    if (CONFIG.DEBUG_MODE) {
      console.log(`[OtoReport Debug] ${message}`, ...args);
    }
  }

  // Global flags and state management
  let otpSubmitted = false;
  let adminLoginAttempted = false;
  let otpButtonClicked = false;
  let isProcessingOTP = false;
  let activeIntervals = new Set();
  let activeObservers = new Set();

  console.log("🚀 OtoReport Automation Suite loaded with config:", CONFIG);

  // Utility function to clear all intervals and observers
  function cleanup() {
    debugLog("Cleaning up intervals and observers...");
    activeIntervals.forEach((interval) => clearInterval(interval));
    activeIntervals.clear();
    activeObservers.forEach((observer) => observer.disconnect());
    activeObservers.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // ADMIN REDIRECT & LOGIN FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════════════════════════

  // Function to check for the WOTP div that triggers admin redirect
  function checkForWOTPDiv() {
    const targetDiv = document.getElementById("wotp");

    if (
      targetDiv &&
      targetDiv.classList.contains("box") &&
      targetDiv.classList.contains("box-block") &&
      targetDiv.classList.contains("tile") &&
      targetDiv.classList.contains("tile-2") &&
      targetDiv.classList.contains("bg-primary") &&
      targetDiv.classList.contains("mb-2") &&
      targetDiv.style.cursor === "pointer"
    ) {
      debugLog("WOTP div detected, redirecting to admin page...");
      cleanup();
      window.location.href = "https://rmwapps.otoreport.com/adm/";
      return true;
    }
    return false;
  }

  // Function to auto-fill admin login form
  function autoFillAdminLogin() {
    if (adminLoginAttempted) {
      return false;
    }

    const usernameField = document.getElementById("idlogin");
    const passwordField = document.getElementById("exampleInputPassword");
    const loginButton = document.getElementById("login");

    if (usernameField && passwordField && loginButton) {
      debugLog("Admin login form detected, auto-filling credentials...");

      // Fill in the credentials
      usernameField.value = CONFIG.ADMIN_USERNAME;
      passwordField.value = CONFIG.ADMIN_PASSWORD;

      // Trigger input events to ensure the form recognizes the values
      usernameField.dispatchEvent(new Event("input", { bubbles: true }));
      passwordField.dispatchEvent(new Event("input", { bubbles: true }));

      // Mark as attempted to prevent multiple attempts
      adminLoginAttempted = true;

      // Wait a moment then submit
      setTimeout(() => {
        debugLog("Submitting admin login form...");
        loginButton.click();
        cleanup();
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
    return Array.from(document.querySelectorAll(selector)).filter((el) =>
      el.textContent.includes(text),
    );
  }

  // Improved OTP extraction with more robust regex
  function extractOTPCode(message) {
    // Try multiple regex patterns
    const patterns = [
      /(\d{6})/, // Any 6 digits
      /:\s*(\d{6})/, // 6 digits after colon
      /login[^:]*:\s*(\d{6})/i, // 6 digits after "login" and colon
    ];

    debugLog(`Trying to extract OTP from: "${message}"`);

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        debugLog(`OTP extracted using pattern ${pattern}: ${match[1]}`);
        return match[1];
      }
    }

    debugLog("No OTP pattern matched");
    return null;
  }

  // Enhanced OTP fetching with better error handling
  async function fetchOTP(retryCount = 0) {
    return new Promise((resolve, reject) => {
      if (retryCount >= CONFIG.MAX_RETRIES) {
        reject(
          new Error(`Exceeded maximum retry attempts (${CONFIG.MAX_RETRIES})`),
        );
        return;
      }

      debugLog(
        `Fetching OTP (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})...`,
      );

      // Try different ways to access GM_xmlhttpRequest
      let gmRequest = null;
      if (typeof GM_xmlhttpRequest !== "undefined") {
        gmRequest = GM_xmlhttpRequest;
      } else if (typeof unsafeWindow.GM_xmlhttpRequest !== "undefined") {
        gmRequest = unsafeWindow.GM_xmlhttpRequest;
      } else if (typeof window.GM_xmlhttpRequest !== "undefined") {
        gmRequest = window.GM_xmlhttpRequest;
      }

      if (!gmRequest) {
        // Fallback to regular fetch if GM_xmlhttpRequest is not available
        debugLog("GM_xmlhttpRequest not available, trying fetch...");

        fetch(CONFIG.OTP_SERVER_URL)
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }
            return response.json();
          })
          .then((data) => {
            console.log("Raw server response:", data); // Debug log

            if (!data.onetimepass || data.onetimepass.length === 0) {
              throw new Error("No OTP data found in the response");
            }

            const otpData = data.onetimepass[0];
            const otpMessage = otpData.pesan;
            const otpDate = new Date(otpData.tgl_entri);
            const currentDate = new Date();
            const timeDiffSeconds = (currentDate - otpDate) / 1000;

            debugLog(`OTP message: "${otpMessage}"`);
            debugLog(`OTP age: ${timeDiffSeconds.toFixed(1)} seconds`);

            // More lenient validity check
            if (timeDiffSeconds <= CONFIG.OTP_VALIDITY_SECONDS) {
              const otpCode = extractOTPCode(otpMessage);
              if (otpCode) {
                debugLog("Fresh OTP code extracted:", otpCode);
                resolve(otpCode);
              } else {
                throw new Error(
                  `OTP code not found in message: "${otpMessage}"`,
                );
              }
            } else {
              debugLog(
                `OTP is ${timeDiffSeconds.toFixed(1)} seconds old, will retry...`,
              );

              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(2000, 1000 * (retryCount + 1)),
              );
            }
          })
          .catch((error) => {
            debugLog("Fetch error:", error.message);

            if (retryCount < CONFIG.MAX_RETRIES - 1) {
              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(3000, 1500 * (retryCount + 1)),
              );
            } else {
              reject(error);
            }
          });

        return;
      }

      // Use GM_xmlhttpRequest if available
      gmRequest({
        method: "GET",
        url: CONFIG.OTP_SERVER_URL,
        timeout: 10000, // Increased timeout
        onload: function (response) {
          try {
            console.log("Raw server response:", response.responseText); // Debug log

            if (response.status !== 200) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const data = JSON.parse(response.responseText);
            if (!data.onetimepass || data.onetimepass.length === 0) {
              throw new Error("No OTP data found in the response");
            }

            const otpData = data.onetimepass[0];
            const otpMessage = otpData.pesan;
            const otpDate = new Date(otpData.tgl_entri);
            const currentDate = new Date();
            const timeDiffSeconds = (currentDate - otpDate) / 1000;

            debugLog(`OTP message: "${otpMessage}"`);
            debugLog(`OTP age: ${timeDiffSeconds.toFixed(1)} seconds`);

            if (timeDiffSeconds <= CONFIG.OTP_VALIDITY_SECONDS) {
              const otpCode = extractOTPCode(otpMessage);
              if (otpCode) {
                debugLog("Fresh OTP code extracted:", otpCode);
                resolve(otpCode);
              } else {
                throw new Error(
                  `OTP code not found in message: "${otpMessage}"`,
                );
              }
            } else {
              debugLog(
                `OTP is ${timeDiffSeconds.toFixed(1)} seconds old, will retry...`,
              );

              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(2000, 1000 * (retryCount + 1)),
              );
            }
          } catch (error) {
            debugLog("Error parsing OTP response:", error.message);

            if (retryCount < CONFIG.MAX_RETRIES - 1) {
              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(3000, 1500 * (retryCount + 1)),
              );
            } else {
              reject(error);
            }
          }
        },
        onerror: function (error) {
          debugLog("Network error:", error);

          if (retryCount < CONFIG.MAX_RETRIES - 1) {
            setTimeout(
              () => {
                fetchOTP(retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              },
              Math.min(3000, 1500 * (retryCount + 1)),
            );
          } else {
            reject(
              new Error(`Network error after ${CONFIG.MAX_RETRIES} attempts`),
            );
          }
        },
        ontimeout: function () {
          debugLog(`Request timed out (attempt ${retryCount + 1})`);

          if (retryCount < CONFIG.MAX_RETRIES - 1) {
            setTimeout(
              () => {
                fetchOTP(retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              },
              Math.min(4000, 2000 * (retryCount + 1)),
            );
          } else {
            reject(new Error("Request timed out after multiple attempts"));
          }
        },
      });
    });
  }

  // Enhanced OTP input detection and submission
  function fillOTPAndSubmit(otpCode) {
    // More comprehensive input field detection
    const otpInputSelectors = [
      'input[name="otp"]#exampleInputPassword',
      'input[name="otp"]',
      'input[type="password"][name="otp"]',
      'input[placeholder*="otp" i]',
      'input[placeholder*="kode" i]',
      "#otp",
      ".otp-input",
      'input[type="text"][maxlength="6"]',
      'input[type="number"][maxlength="6"]',
    ];

    let otpInput = null;
    for (const selector of otpInputSelectors) {
      otpInput = document.querySelector(selector);
      if (otpInput) {
        debugLog(`Found OTP input using selector: ${selector}`);
        break;
      }
    }

    if (!otpInput) {
      debugLog("OTP input field not found with any selector");
      return false;
    }

    debugLog("Filling OTP input with code:", otpCode);

    // Clear and fill input
    otpInput.value = "";
    otpInput.focus();
    otpInput.value = otpCode;

    // Trigger comprehensive events
    const events = ["focus", "input", "change", "keyup", "keydown", "blur"];
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      otpInput.dispatchEvent(event);
    });

    // Enhanced submit button detection
    let submitButton = null;
    const form = otpInput.closest("form");

    // Try multiple submit button selectors
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      ".btn-primary",
      'button:contains("Submit")',
      'button:contains("Login")',
      'button:contains("Masuk")',
      'button:contains("OK")',
      '[onclick*="submit"]',
    ];

    if (form) {
      for (const selector of submitSelectors) {
        submitButton = form.querySelector(selector);
        if (submitButton) break;
      }
    }

    // Fallback: look globally
    if (!submitButton) {
      for (const selector of submitSelectors) {
        submitButton = document.querySelector(selector);
        if (submitButton) break;
      }
    }

    // Submit the form
    if (submitButton) {
      debugLog("Found submit button, clicking in 500ms...");

      setTimeout(() => {
        submitButton.click();
        otpSubmitted = true;
        cleanup();
        debugLog("OTP submitted successfully");
      }, 500); // Longer delay to ensure input is processed

      return true;
    } else if (form) {
      debugLog("Submit button not found, submitting form directly...");
      setTimeout(() => {
        form.submit();
        otpSubmitted = true;
        cleanup();
        debugLog("Form submitted directly");
      }, 500);
      return true;
    }

    debugLog("Could not find submit method");
    return false;
  }

  // Function to check for and click the "Kirim OTP ke saya" button
  function clickKirimOTPButton() {
    // Prevent multiple processing
    if (otpSubmitted || otpButtonClicked || isProcessingOTP) {
      return false;
    }

    // Look for the specific button you mentioned
    const kirimButton = document.querySelector(
      "a#kirimotp.btn.btn-outline-primary",
    );

    if (!kirimButton) {
      debugLog("OTP button not found yet...");
      return false;
    }

    debugLog('Found "Kirim OTP ke saya" button, clicking...');

    // Set flags to prevent duplicate processing
    otpButtonClicked = true;
    isProcessingOTP = true;

    // Click the button
    kirimButton.click();

    // Disable the button to prevent multiple clicks
    kirimButton.style.pointerEvents = "none";
    kirimButton.style.opacity = "0.5";
    kirimButton.textContent = "Mengirim OTP...";

    // Wait for the specified delay, then fetch and fill OTP
    setTimeout(async () => {
      if (otpSubmitted) {
        debugLog("OTP already submitted, skipping...");
        return;
      }

      debugLog("Fetching OTP after button click...");

      try {
        const otpCode = await fetchOTP();
        debugLog("Successfully retrieved OTP code:", otpCode);

        const success = fillOTPAndSubmit(otpCode);

        if (success) {
          console.log("✅ Successfully auto-filled and submitted OTP");
        } else {
          console.error("❌ Failed to submit OTP form");
          isProcessingOTP = false; // Allow retry
        }
      } catch (error) {
        console.error("❌ Error handling OTP:", error.message);
        isProcessingOTP = false; // Allow retry

        // Re-enable button on error
        kirimButton.style.pointerEvents = "";
        kirimButton.style.opacity = "";
        kirimButton.textContent = "Kirim OTP ke saya";
        otpButtonClicked = false;
      }
    }, CONFIG.BUTTON_CLICK_DELAY);

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // MAIN EXECUTION LOGIC
  // ═══════════════════════════════════════════════════════════════════════════════════════

  // Main function to handle different page states
  function initializeScript() {
    const currentURL = window.location.href;

    // Check if we're on the admin login page
    if (currentURL.includes("/adm/")) {
      debugLog("Admin page detected, setting up auto-login...");

      // Try to auto-fill immediately if elements are already present
      if (autoFillAdminLogin()) {
        return;
      }

      // Set up observer for admin page (single observer)
      const adminObserver = new MutationObserver(function (mutations) {
        if (adminLoginAttempted) {
          adminObserver.disconnect();
          return;
        }

        for (const mutation of mutations) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            if (autoFillAdminLogin()) {
              adminObserver.disconnect();
              activeObservers.delete(adminObserver);
              return;
            }
          }
        }
      });

      adminObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      activeObservers.add(adminObserver);

      // Fallback interval for admin page (with cleanup)
      const adminInterval = setInterval(() => {
        if (adminLoginAttempted || autoFillAdminLogin()) {
          clearInterval(adminInterval);
          activeIntervals.delete(adminInterval);
          adminObserver.disconnect();
          activeObservers.delete(adminObserver);
        }
      }, 1000);
      activeIntervals.add(adminInterval);

      return;
    }

    // For non-admin pages, handle WOTP detection and OTP
    debugLog(
      "Non-admin page detected, setting up WOTP detection and OTP handling...",
    );

    // Check for WOTP div immediately
    if (checkForWOTPDiv()) {
      return;
    }

    // Single observer for both WOTP and OTP functionality
    const mainObserver = new MutationObserver(function (mutations) {
      try {
        // Check for WOTP div first (higher priority)
        if (checkForWOTPDiv()) {
          return; // cleanup() is called in checkForWOTPDiv()
        }

        // Then check for OTP functionality
        if (!otpSubmitted && !isProcessingOTP) {
          clickKirimOTPButton();
        }
      } catch (error) {
        debugLog("Error in mutation observer:", error);
      }
    });

    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    activeObservers.add(mainObserver);

    // Periodic check with proper cleanup
    const periodicInterval = setInterval(() => {
      try {
        if (checkForWOTPDiv()) {
          return; // cleanup() called in checkForWOTPDiv()
        }

        if (otpSubmitted) {
          clearInterval(periodicInterval);
          activeIntervals.delete(periodicInterval);
          debugLog("OTP completed, stopping periodic checks");
          return;
        }

        clickKirimOTPButton();
      } catch (error) {
        debugLog("Error in periodic check:", error);
      }
    }, CONFIG.OTP_CHECK_INTERVAL);
    activeIntervals.add(periodicInterval);

    // Cleanup after reasonable time to prevent infinite running
    setTimeout(() => {
      if (!otpSubmitted && !adminLoginAttempted) {
        debugLog("Timeout reached, cleaning up...");
        cleanup();
      }
    }, 300000); // 5 minutes timeout
  }

  // Initialize the script when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeScript);
  } else {
    initializeScript();
  }

  // Clean up when page is unloaded
  window.addEventListener("beforeunload", () => {
    debugLog("Page unloading, cleaning up...");
    cleanup();
    // Reset flags
    otpSubmitted = false;
    adminLoginAttempted = false;
    otpButtonClicked = false;
    isProcessingOTP = false;
  });

  // Emergency cleanup function (can be called from console)
  window.otoreportCleanup = cleanup;

  console.log(
    "🚀 OtoReport Complete Automation Suite initialized successfully",
  );
})();
