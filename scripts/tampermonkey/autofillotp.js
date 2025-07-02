(function () {
  "use strict";

  // ══════════════════════════════════════════════════════
  // 🔧 CONFIGURATION
  const OTP_SERVER_URL =
    unsafeWindow.otp_server_url || "http://localhost:8040/onetimepass";
  const OTP_VALIDITY_SECONDS = unsafeWindow.otp_validity || 5;
  const OTP_FETCH_RETRIES = unsafeWindow.fetct_retries || 3;
  const BUTTON_CLICK_DELAY = unsafeWindow.click_delay || 200;
  const AUTO_USERNAME = unsafeWindow.username || "administrator";
  const AUTO_PASSWORD = unsafeWindow.password || "password";
  const REDIRECT_ALLOWED = unsafeWindow.redirect || true;
  // ══════════════════════════════════════════════════════

  let otpSubmitted = false;

  function findElementsByText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).filter((el) =>
      el.textContent.includes(text),
    );
  }

  function extractOTPCode(message) {
    const otpRegex = /(\d{6})/;
    const match = message.match(otpRegex);
    return match?.[1] ?? null;
  }

  function fetchOTP(retryCount = 0) {
    return new Promise((resolve, reject) => {
      if (retryCount >= OTP_FETCH_RETRIES) {
        reject("Exceeded max retries");
        return;
      }

      GM_xmlhttpRequest({
        method: "GET",
        url: OTP_SERVER_URL,
        timeout: 5000,
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);
            const otpData = data.onetimepass?.[0];
            if (!otpData) return reject("No OTP data found");

            const otpMessage = otpData.pesan;
            const otpDate = new Date(otpData.tgl_entri);
            const now = new Date();
            const age = (now - otpDate) / 1000;

            if (age <= OTP_VALIDITY_SECONDS) {
              const otp = extractOTPCode(otpMessage);
              otp ? resolve(otp) : reject("OTP not found in message");
            } else {
              setTimeout(
                () =>
                  fetchOTP(retryCount + 1)
                    .then(resolve)
                    .catch(reject),
                500,
              );
            }
          } catch (e) {
            reject("Error parsing OTP response: " + e.message);
          }
        },
        onerror: () => reject("Network error fetching OTP"),
        ontimeout: () => {
          if (retryCount < OTP_FETCH_RETRIES - 1) {
            setTimeout(
              () =>
                fetchOTP(retryCount + 1)
                  .then(resolve)
                  .catch(reject),
              500,
            );
          } else {
            reject("OTP request timed out");
          }
        },
      });
    });
  }

  function fillOTPAndSubmit(code) {
    const otpInput = document.querySelector('input[name="otp"]');
    if (!otpInput) return false;

    otpInput.value = code;
    otpInput.dispatchEvent(new Event("input", { bubbles: true }));

    let button =
      findElementsByText("button", "SUBMIT")[0] ||
      findElementsByText(".btn", "SUBMIT")[0] ||
      otpInput.closest("form")?.querySelector('button[type="submit"]') ||
      Array.from(document.querySelectorAll("button, .btn")).find((btn) =>
        /submit|login|sign in|ok|masuk|lanjut/i.test(btn.textContent),
      );

    if (!button) {
      const fallback = findElementsByText("*", "SUBMIT").find(
        (el) => el.textContent.trim() === "SUBMIT",
      );
      button = fallback ?? null;
    }

    if (button) {
      button.click();
      otpSubmitted = true;
      return true;
    }

    return false;
  }

  function clickKirimOTPButton() {
    if (otpSubmitted) return false;

    let btn =
      document.querySelector("a#kirimotp.btn.btn-outline-primary") ||
      findElementsByText("a.btn", "Kirim OTP ke saya")[0];

    if (btn) {
      btn.click();
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.5";

      setTimeout(() => {
        if (!otpSubmitted) {
          fetchOTP()
            .then((code) => fillOTPAndSubmit(code))
            .catch(console.error);
        }
      }, BUTTON_CLICK_DELAY);

      return true;
    }

    return false;
  }

  function processOTPInput() {
    const otpInput = document.querySelector(
      'input[name="otp"]#exampleInputPassword',
    );
    if (otpInput && observer) {
      observer.disconnect();
    }
    clickKirimOTPButton();
  }

  let observer = new MutationObserver((muts) => {
    for (const mut of muts) {
      if (mut.type === "childList" && mut.addedNodes.length > 0) {
        processOTPInput();
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });
  processOTPInput();

  window.addEventListener("beforeunload", () => (otpSubmitted = false));

  window.otpCheckInterval = setInterval(() => {
    if (otpSubmitted) {
      clearInterval(window.otpCheckInterval);
      return;
    }
    clickKirimOTPButton();
  }, 2000);

  // ────────────────────────────────────────────────────────
  // 🔄 AUTO-REDIRECT TO ADM & LOGIN
  // ────────────────────────────────────────────────────────

  function checkForWOTPDiv() {
    const target = document.getElementById("wotp");
    if (
      target?.classList.contains("box") &&
      target.classList.contains("tile") &&
      target.classList.contains("tile-2") &&
      target.classList.contains("bg-primary") &&
      target.style.cursor === "pointer"
    ) {
      window.location.href = "https://rmwapps.otoreport.com/adm/";
      return true;
    }
    return false;
  }

  function autoFillLogin() {
    const user = document.getElementById("idlogin");
    const pass = document.getElementById("exampleInputPassword");
    const btn = document.getElementById("login");

    if (user && pass && btn) {
      user.value = AUTO_USERNAME;
      pass.value = AUTO_PASSWORD;
      user.dispatchEvent(new Event("input", { bubbles: true }));
      pass.dispatchEvent(new Event("input", { bubbles: true }));

      setTimeout(() => btn.click(), 500);
      return true;
    }
    return false;
  }

  if (window.location.href.includes("/adm/")) {
    if (autoFillLogin()) return;

    const adminObserver = new MutationObserver((muts) => {
      muts.forEach(() => {
        if (autoFillLogin()) adminObserver.disconnect();
      });
    });

    adminObserver.observe(document.body, { childList: true, subtree: true });

    const interval = setInterval(() => {
      if (autoFillLogin()) {
        clearInterval(interval);
        adminObserver.disconnect();
      }
    }, 1000);
  } else if (REDIRECT_ALLOWED) {
    if (checkForWOTPDiv()) return;

    const detectObserver = new MutationObserver((muts) => {
      muts.forEach(() => checkForWOTPDiv());
    });

    detectObserver.observe(document.body, { childList: true, subtree: true });

    const fallbackCheck = setInterval(() => {
      if (checkForWOTPDiv()) {
        clearInterval(fallbackCheck);
        detectObserver.disconnect();
      }
    }, 1000);
  }
})();
