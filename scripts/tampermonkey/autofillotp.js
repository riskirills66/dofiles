// Key fixes for OTP automation issues:

// 1. Increase OTP validity window
const CONFIG = {
  ADMIN_USERNAME: unsafeWindow.otoreport_admin_username || "administrator",
  ADMIN_PASSWORD: unsafeWindow.otoreport_admin_password || "password",
  OTP_SERVER_URL:
    unsafeWindow.otoreport_otp_server || "http://localhost:8040/onetimepass",
  OTP_VALIDITY_SECONDS: unsafeWindow.otoreport_otp_validity || 30, // Increased from 5 to 30 seconds
  MAX_RETRIES: unsafeWindow.otoreport_max_retries || 3,
  BUTTON_CLICK_DELAY: unsafeWindow.otoreport_button_delay || 500, // Reduced to 500ms
  OTP_CHECK_INTERVAL: unsafeWindow.otoreport_check_interval || 2000,
  DEBUG_MODE: unsafeWindow.otoreport_debug || true, // Enable debug by default
};

// 2. Enhanced OTP fetching with better error handling
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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
              throw new Error(`OTP code not found in message: "${otpMessage}"`);
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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
              throw new Error(`OTP code not found in message: "${otpMessage}"`);
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

// 3. Improved OTP extraction with more robust regex
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

// 4. Enhanced OTP input detection
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
