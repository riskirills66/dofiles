(function () {
  "use strict";

  // Get configuration from unsafeWindow (set by loader)
  const CONFIG = {
    ADMIN_USERNAME: unsafeWindow.otoreport_admin_username || "administrator",
    ADMIN_PASSWORD: unsafeWindow.otoreport_admin_password || "password",
    OTP_SERVER_URL:
      unsafeWindow.otoreport_otp_server || "http://localhost:8040/onetimepass",
    OTP_VALIDITY_SECONDS: unsafeWindow.otoreport_otp_validity || 5,
    MAX_RETRIES: unsafeWindow.otoreport_max_retries || 3,
    BUTTON_CLICK_DELAY: unsafeWindow.otoreport_button_delay || 200,
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

  // Function to extract the OTP code from the message
  function extractOTPCode(message) {
    const otpRegex = /(\d{6})/;
    const match = message.match(otpRegex);
    return match ? match[1] : null;
  }

  // Improved OTP fetching with better error handling and no infinite loops
  async function fetchOTP(retryCount = 0) {
    return new Promise((resolve, reject) => {
      if (retryCount >= CONFIG.MAX_RETRIES) {
        reject(
          new Error(`Exceeded maximum retry attempts (${CONFIG.MAX_RETRIES})`),
        );
        return;
      }

      // Check if GM_xmlhttpRequest is available
      if (typeof unsafeWindow.GM_xmlhttpRequest !== "function") {
        reject(new Error("GM_xmlhttpRequest not available"));
        return;
      }

      debugLog(
        `Fetching OTP (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})...`,
      );

      unsafeWindow.GM_xmlhttpRequest({
        method: "GET",
        url: CONFIG.OTP_SERVER_URL,
        timeout: 5000,
        onload: function (response) {
          try {
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

            // Check if OTP is fresh
            if (timeDiffSeconds <= CONFIG.OTP_VALIDITY_SECONDS) {
              const otpCode = extractOTPCode(otpMessage);
              if (otpCode) {
                debugLog("Fresh OTP code extracted:", otpCode);
                resolve(otpCode);
              } else {
                throw new Error("OTP code not found in the message");
              }
            } else {
              debugLog(
                `OTP is ${timeDiffSeconds.toFixed(1)} seconds old, will retry...`,
              );

              // Use setTimeout to prevent stack overflow
              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(1000, 500 * (retryCount + 1)),
              ); // Exponential backoff
            }
          } catch (error) {
            debugLog("Error parsing OTP response:", error.message);

            // Retry on parse errors too, but with delay
            if (retryCount < CONFIG.MAX_RETRIES - 1) {
              setTimeout(
                () => {
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.min(2000, 1000 * (retryCount + 1)),
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
              Math.min(2000, 1000 * (retryCount + 1)),
            );
          } else {
            reject(
              new Error(
                `Network error after ${CONFIG.MAX_RETRIES} attempts: ${error.error || "Unknown error"}`,
              ),
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
              Math.min(3000, 1500 * (retryCount + 1)),
            );
          } else {
            reject(new Error("Request timed out after multiple attempts"));
          }
        },
      });
    });
  }

  // Function to fill the OTP input and click submit button
  function fillOTPAndSubmit(otpCode) {
    // Target the specific OTP input field you mentioned
    const otpInput =
      document.querySelector('input[name="otp"]#exampleInputPassword') ||
      document.querySelector('input[name="otp"]');

    if (!otpInput) {
      debugLog("OTP input field not found");
      return false;
    }

    debugLog("Filling OTP input with code:", otpCode);

    // Clear any existing value and fill with OTP code
    otpInput.value = "";
    otpInput.value = otpCode;

    // Trigger multiple events to ensure compatibility
    ["input", "change", "keyup"].forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      otpInput.dispatchEvent(event);
    });

    // Find the submit button using multiple methods
    let submitButton = null;

    // Method 1: Look for form submit button
    const form = otpInput.closest("form");
    if (form) {
      submitButton =
        form.querySelector('button[type="submit"]') ||
        form.querySelector('input[type="submit"]');
    }

    // Method 2: Find by text content
    if (!submitButton) {
      const buttons = document.querySelectorAll(
        'button, input[type="submit"], .btn',
      );
      for (const button of buttons) {
        const text = button.textContent || button.value || "";
        if (
          text.toLowerCase().includes("submit") ||
          text.toLowerCase().includes("login") ||
          text.toLowerCase().includes("masuk") ||
          text.toLowerCase().includes("lanjut") ||
          text.toLowerCase().includes("ok")
        ) {
          submitButton = button;
          break;
        }
      }
    }

    // Method 3: Look for buttons near the OTP input
    if (!submitButton) {
      let parent = otpInput.parentElement;
      let attempts = 0;
      while (parent && attempts < 5) {
        submitButton =
          parent.querySelector('button:not([type="button"])') ||
          parent.querySelector(".btn:not(.btn-outline-primary)");
        if (submitButton) break;
        parent = parent.parentElement;
        attempts++;
      }
    }

    // Submit the form
    if (submitButton) {
      debugLog("Found submit button, clicking...");

      // Add a small delay to ensure the input value is processed
      setTimeout(() => {
        submitButton.click();
        otpSubmitted = true;
        cleanup(); // Clean up after successful submission
        debugLog("OTP submitted successfully");
      }, 100);

      return true;
    } else if (form) {
      // Fallback: submit the form directly
      debugLog("Submit button not found, submitting form directly...");
      setTimeout(() => {
        form.submit();
        otpSubmitted = true;
        cleanup();
        debugLog("Form submitted directly");
      }, 100);
      return true;
    }

    debugLog("Could not find submit button or form");
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

