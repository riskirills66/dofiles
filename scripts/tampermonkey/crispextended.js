(function () {
  console.log("[TM] Script version: COMPACT-UI-v2 loaded");
  const API_URL = unsafeWindow.trx_monitor_url || "http://localhost:8040";
  const TG_API_URL = unsafeWindow.tg_api_url || "http://localhost:4040";
  const apiBase = `${API_URL}`;
  const tgApi = `${TG_API_URL}`;

  ("use strict");

  function formatDate(dateString) {
    const regex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d{3}Z/;
    const match = dateString && dateString.match(regex);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]} ${match[4]}:${match[5]}:${match[6]}`;
    }
    return dateString || "";
  }

  function showToast(message, type = "success") {
    const notification = document.createElement("div");
    notification.textContent = message;
    let bgColor = "#4CAF50"; // success - green
    if (type === "error") {
      bgColor = "#f44336"; // error - red
    } else if (type === "info") {
      bgColor = "#2196F3"; // info - blue
    }
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-size: 14px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function isAnyModalOpen() {
    // Check for transaction/deposit modals, but exclude fingerprint display and context menu
    const modals = document.querySelectorAll(".userscript-modal");
    for (let modal of modals) {
      if (modal.id !== "fingerprint-display" && modal !== contextMenu) {
        return true;
      }
    }
    return false;
  }

  function getStatusEmoji(status) {
    const statusMap = {
      "Sedang Diproses": "⏳",
      "Menunggu Jawaban": "⏰",
      "Belum Diproses": "📋",
      "Tidak ada parsing": "❓",
      Terjadwal: "📅",
      Sukses: "✅",
      "Sukses Masuk Outbox": "✅",
      "Sukses Masuk Transaksi": "✅",
      "Sukses Masuk CS": "✅",
      Gagal: "❌",
      "Bukan Reseller": "🚫",
      "Format Salah": "📝",
      "Saldo Tidak Cukup": "💸",
      "Produk Salah": "📦",
      "Stok Kosong": "📭",
      "Transaksi Dobel": "🔄",
      "Produk Gangguan": "⚠️",
      "Parameter Salah": "⚙️",
      "Pin Salah": "🔒",
      Dibatalkan: "🚫",
      "Reseller Tidak Aktif": "😴",
      "Tujuan Salah": "🎯",
      "Tujuan Di Luar Wilayah": "🌍",
      "Kode Area Tidak Cocok": "📍",
      Timeout: "⏱️",
      "Nomor Blacklist": "🚫",
      "Wrong Signature": "✍️",
      "Nomor Tidak Aktif": "📵",
      "Harga Tidak Sesuai": "💰",
      "Tidak Ada Data": "📂",
      "Qty Tidak Sesuai": "🔢",
      "Limit Harian": "📊",
      "Reseller Suspend": "⏸️",
      Diabaikan: "👁️‍🗨️",
      "Unit Tidak Cukup": "📉",
      "Invalid Terminal": "💻",
      "Group Dissallow": "👥",
      "Access Denied": "🔐",
      Cutoff: "✂️",
      "Harus Ubah Pin": "🔑",
      "Nomor Hangus": "🗑️",
      "Nomor Masa Tenggang": "⏳",
    };

    return statusMap[status] || "❓";
  }

  function getDepositStatusEmoji(status) {
    const statusMap = {
      Open: "🔄",
      Cancelled: "❌",
      Settled: "✅",
    };

    return statusMap[status] || "❓";
  }

  function displayTransactionModal(data) {
    const modal = document.createElement("div");
    modal.id = "transactionModal";
    modal.className = "userscript-modal"; // Add class for Tridactyl targeting
    modal.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: white;
            padding: 20px;
            z-index: 10001;
            border-radius: 16px 16px 0 0;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
            max-height: 85vh;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        `;

    const table = document.createElement("table");
    table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            color: black;
            background-color: white;
            table-layout: fixed;
        `;

    const headers = [
      "Tanggal",
      "Produk",
      "Tujuan",
      "SN",
      "Status",
      "Reseller",
      "Nama",
      "Harga",
      "Modul",
      "",
      "",
    ];
    const headerRow = document.createElement("tr");
    const columnWidths = [
      "12%",
      "7%",
      "12%",
      "15%",
      "8%",
      "10%",
      "14%",
      "10%",
      "10%",
      "2%",
      "2%",
    ];

    headers.forEach((headerText, index) => {
      const th = document.createElement("th");
      th.innerText = headerText;
      th.style.cssText = `
                border: 1px solid #ccc;
                padding: 4px 6px;
                color: black;
                font-size: 12px;
                width: ${columnWidths[index]};
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const rowData = [
        formatDate(row.tgl_entri) || "",
        row.kode_produk || "",
        row.tujuan || "",
        row.sn || "",
        row.status || "",
        row.kode_reseller || "",
        row.nama_reseller || "",
        new Intl.NumberFormat("id-ID").format(row.harga) || "",
        row.kode_modul_label || "",
      ];

      rowData.forEach((cellData, index) => {
        const td = document.createElement("td");
        td.innerText = cellData;
        td.setAttribute("tabindex", "0");
        td.setAttribute("role", "button");
        td.style.cssText = `
                    border: 1px solid #ccc;
                    padding: 4px 6px;
                    color: black;
                    font-size: 11px;
                    width: ${columnWidths[index]};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.2;
                    cursor: pointer;
                    transition: background 0.2s;
                `;
        td.title = "Click to copy";
        td.onclick = () => {
          navigator.clipboard
            .writeText(cellData)
            .catch((error) => console.error("Error copying cell:", error));
          // Close modal after copying
          closeModal();
        };
        td.onmouseenter = () => {
          td.style.background = "#f0f0f0";
        };
        td.onmouseleave = () => {
          td.style.background = "";
        };
        tr.appendChild(td);
      });

      // Report button - Forward to Telegram via module and copy to clipboard
      const reportButton = document.createElement("button");
      reportButton.innerText = "🚩";
      reportButton.style.cssText = `
                background: transparent;
                border: none;
                padding: 2px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            `;
      reportButton.onclick = () => {
        // Copy formatted text to clipboard
        const formattedText = `📅 Tanggal: ${formatDate(row.tgl_entri) || ""}.
📦 Kode: ${row.kode_produk || ""}.
📱 Tujuan: ${row.tujuan || ""}.
🔢 Ref: ${row.sn || ""}.
👤 Reseller: ${row.kode_reseller || ""} - ${row.nama_reseller || ""}.
💰 Harga: ${new Intl.NumberFormat("id-ID").format(row.harga) || ""}.
⚠️ Status: Dalam pengecekan lebih lanjut`;

        navigator.clipboard
          .writeText(formattedText)
          .catch((error) => console.error("Error copying report:", error));

        // Forward to Telegram
        const module = row.kode_modul_label || "";
        const message = `${formatDate(row.tgl_entri) || ""} ${row.tujuan || ""} ${row.sn || ""} ${row.status || ""} bantu cek, kak`;

        reportButton.innerText = "⏳";
        GM_xmlhttpRequest({
          method: "GET",
          url: `${apiBase}/forward?module=${encodeURIComponent(module)}&message=${encodeURIComponent(message)}`,
          onload: function (response) {
            reportButton.innerText = "✅";
            setTimeout(() => {
              reportButton.innerText = "🚩";
            }, 2000);
          },
          onerror: function (error) {
            console.error("Error forwarding:", error);
            reportButton.innerText = "❌";
            setTimeout(() => {
              reportButton.innerText = "🚩";
            }, 2000);
          },
        });
        
        // Close modal after report action
        closeModal();
      };
      const reportCell = document.createElement("td");
      reportCell.style.cssText = `
                border: 1px solid #ccc;
                padding: 2px;
                width: ${columnWidths[9]};
                text-align: center;
            `;
      reportCell.appendChild(reportButton);
      tr.appendChild(reportCell);

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.innerText = "📋";
      copyButton.style.cssText = `
                background: transparent;
                border: none;
                padding: 2px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            `;
      copyButton.onclick = () => {
        const formattedText = `📅 Tanggal: ${formatDate(row.tgl_entri) || ""}.
📦 Kode: ${row.kode_produk || ""}.
📱 Tujuan: ${row.tujuan || ""}.
🔢 Ref: ${row.sn || ""}.
👤 Reseller: ${row.kode_reseller || ""} - ${row.nama_reseller || ""}.
💰 Harga: ${new Intl.NumberFormat("id-ID").format(row.harga) || ""}.
${getStatusEmoji(row.status)} Status: ${row.status || ""}`;
        navigator.clipboard
          .writeText(formattedText)
          .catch((error) => console.error("Error copying text:", error));
        // Close modal after copying
        closeModal();
      };

      const copyCell = document.createElement("td");
      copyCell.style.cssText = `
                border: 1px solid #ccc;
                padding: 2px;
                width: ${columnWidths[10]};
                text-align: center;
            `;
      copyCell.appendChild(copyButton);
      tr.appendChild(copyCell);

      table.appendChild(tr);
    });

    modal.appendChild(table);

    // Function to close modal and cleanup
    function closeModal() {
      modal.style.transform = "translateY(100%)";
      setTimeout(() => {
        modal.remove();
      }, 300);
      document.removeEventListener("keydown", escapeHandler);
      window.closeUserscriptModal = null; // Clear the reference
    }

    // Add global reference for Tridactyl access
    window.closeUserscriptModal = closeModal;

    document.body.appendChild(modal);

    // Trigger animation
    requestAnimationFrame(() => {
      modal.style.transform = "translateY(0)";
      // Focus the modal after animation starts
      modal.focus();
    });

    // Event listeners for closing modal
    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }
    
    // Close modal when it loses focus
    function blurHandler(event) {
      // Check if the new focus target is outside the modal
      if (!modal.contains(event.relatedTarget)) {
        closeModal();
      }
    }

    modal.setAttribute("tabindex", "-1");
    modal.addEventListener("blur", blurHandler, true);
    document.addEventListener("keydown", escapeHandler);
  }

  function displayDepositModal(data) {
    const modal = document.createElement("div");
    modal.id = "depositModal";
    modal.className = "userscript-modal";
    modal.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: white;
            padding: 20px;
            z-index: 10001;
            border-radius: 16px 16px 0 0;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
            max-height: 85vh;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        `;

    const table = document.createElement("table");
    table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            color: black;
            background-color: white;
            table-layout: fixed;
        `;

    const headers = [
      "Tanggal",
      "Reseller",
      "Nama",
      "Jumlah",
      "Status",
      "Update",
      "",
      "",
    ];
    const headerRow = document.createElement("tr");
    const columnWidths = ["17%", "12%", "20%", "15%", "12%", "17%", "7%", "8%"];

    headers.forEach((headerText, index) => {
      const th = document.createElement("th");
      th.innerText = headerText;
      th.style.cssText = `
                border: 1px solid #ccc;
                padding: 6px 8px;
                color: black;
                font-size: 13px;
                width: ${columnWidths[index]};
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const rowData = [
        formatDate(row.waktu) || "",
        row.kode_reseller || "",
        row.nama_reseller || "",
        new Intl.NumberFormat("id-ID").format(row.jumlah) || "",
        row.status || "",
        formatDate(row.tgl_status) || "",
      ];

      rowData.forEach((cellData, index) => {
        const td = document.createElement("td");
        td.innerText = cellData;
        td.setAttribute("tabindex", "0");
        td.setAttribute("role", "button");
        td.style.cssText = `
                    border: 1px solid #ccc;
                    padding: 6px 8px;
                    color: black;
                    font-size: 12px;
                    width: ${columnWidths[index]};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.3;
                    cursor: pointer;
                    transition: background 0.2s;
                `;
        td.title = "Click to copy";
        td.onclick = () => {
          navigator.clipboard
            .writeText(cellData)
            .catch((error) => console.error("Error copying cell:", error));
          // Close modal after copying
          closeModal();
        };
        td.onmouseenter = () => {
          td.style.background = "#f0f0f0";
        };
        td.onmouseleave = () => {
          td.style.background = "";
        };
        tr.appendChild(td);
      });

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.innerText = "📋";
      copyButton.title = "Copy Data";
      copyButton.style.cssText = `
                background: transparent;
                border: none;
                padding: 4px;
                font-size: 18px;
                cursor: pointer;
                width: 100%;
            `;
      copyButton.onclick = () => {
        let formattedText = `📅 Tanggal: ${formatDate(row.waktu) || ""}.
🏪 Reseller: ${row.kode_reseller || ""}.
👤 Nama: ${row.nama_reseller || ""}.
💰 Jumlah: ${new Intl.NumberFormat("id-ID").format(row.jumlah) || ""}.
${getDepositStatusEmoji(row.status)} Status: ${row.status || ""}`;

        // Only show Update line for Cancelled or Settled status
        if (row.status === "Cancelled" || row.status === "Settled") {
          formattedText += `.
🔄 Update: ${formatDate(row.tgl_status) || ""}`;
        }

        navigator.clipboard
          .writeText(formattedText)
          .catch((error) => console.error("Error copying text:", error));
        // Close modal after copying
        closeModal();
      };

      const copyCell = document.createElement("td");
      copyCell.style.cssText = `
                border: 1px solid #ccc;
                padding: 4px;
                width: ${columnWidths[6]};
                text-align: center;
            `;
      copyCell.appendChild(copyButton);
      tr.appendChild(copyCell);

      // -------- Submit Poin Button (SYMBOL) ---------
      const submitPoinBtn = document.createElement("button");
      submitPoinBtn.innerText = "📤";
      submitPoinBtn.title = "Submit Poin";
      submitPoinBtn.style.cssText = `
                background: #0074D9;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 5px 7px;
                font-size: 18px;
                cursor: pointer;
                transition: background 0.2s;
            `;

      function calculatePoin(saldo) {
        let poin = Math.floor(Number(saldo) / 500000) * 100;
        if (poin > 1200) poin = 1200;
        return poin;
      }

      submitPoinBtn.onclick = () => {
        const kode = encodeURIComponent(row.kode_reseller || "");
        let nama = encodeURIComponent(row.nama_reseller || "");
        const saldo = Number(row.jumlah) || 0;
        const poin = calculatePoin(saldo);

        const url = `${apiBase}/submit?kode=${kode}&nama=${nama}&saldo=${saldo}&poin=${poin}`;
        submitPoinBtn.disabled = true;
        submitPoinBtn.innerText = "⏳";

        GM_xmlhttpRequest({
          method: "GET",
          url: url,
          onload: function (response) {
            submitPoinBtn.innerText = "✅";
            setTimeout(() => {
              submitPoinBtn.innerText = "📤";
              submitPoinBtn.disabled = false;
            }, 2000);
          },
          onerror: function () {
            submitPoinBtn.innerText = "❌";
            setTimeout(() => {
              submitPoinBtn.innerText = "📤";
              submitPoinBtn.disabled = false;
            }, 2000);
          },
        });
        
        // Close modal after submit action
        closeModal();
      };

      const submitCell = document.createElement("td");
      submitCell.style.cssText = `
                border: 1px solid #ccc;
                padding: 4px;
                width: ${columnWidths[7]};
                text-align: center;
            `;
      submitCell.appendChild(submitPoinBtn);
      tr.appendChild(submitCell);

      table.appendChild(tr);
    });

    modal.appendChild(table);

    function closeModal() {
      modal.style.transform = "translateY(100%)";
      setTimeout(() => {
        modal.remove();
      }, 300);
      document.removeEventListener("keydown", escapeHandler);
      window.closeUserscriptModal = null;
    }
    window.closeUserscriptModal = closeModal;

    document.body.appendChild(modal);

    // Trigger animation
    requestAnimationFrame(() => {
      modal.style.transform = "translateY(0)";
      // Focus the modal after animation starts
      modal.focus();
    });

    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }
    
    // Close modal when it loses focus
    function blurHandler(event) {
      // Check if the new focus target is outside the modal
      if (!modal.contains(event.relatedTarget)) {
        closeModal();
      }
    }
    
    modal.setAttribute("tabindex", "-1");
    modal.addEventListener("blur", blurHandler, true);
    document.addEventListener("keydown", escapeHandler);
  }

  // Context menu and keyboard navigation (unchanged)
  let contextMenu = null;
  let selectedText = "";
  let selectedIndex = 0;
  let menuItems = [];

  document.addEventListener("contextmenu", function (e) {
    let rawSelected = window.getSelection().toString().trim();
    let match = rawSelected.match(/[a-zA-Z0-9]+/g);
    selectedText = match ? match.join("") : "";

    if (selectedText) {
      e.preventDefault();
      e.stopPropagation();

      // Show loading toast
      showToast("Loading...", "info");

      // Check if it starts with APPS - if so, fetch verification data directly
      if (selectedText.toUpperCase().startsWith('APPS')) {
        checkVerification(selectedText.toUpperCase());
        return;
      }

      // Try deposit first
      GM_xmlhttpRequest({
        method: "GET",
        url: `${apiBase}/deposit?identifier=${selectedText}`,
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);
            if (data && data.length > 0) {
              displayDepositModal(data);
            } else {
              // If no deposit data, try transaction
              checkTransactionFallback(selectedText);
            }
          } catch (error) {
            console.error("Error parsing deposit data:", error);
            // Try transaction as fallback
            checkTransactionFallback(selectedText);
          }
        },
        onerror: function (error) {
          console.error("Error fetching deposit data:", error);
          // Try transaction as fallback
          checkTransactionFallback(selectedText);
        },
      });
    }
  });

  function checkTransactionFallback(dest) {
    // Check if it starts with APPS - if so, fetch verification data
    if (dest.toUpperCase().startsWith('APPS')) {
      checkVerification(dest.toUpperCase());
      return;
    }
    
    GM_xmlhttpRequest({
      method: "GET",
      url: `${apiBase}/trx?dest=${dest}`,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          if (data && data.length > 0) {
            displayTransactionModal(data);
          } else {
            showToast("No data found", "error");
          }
        } catch (error) {
          console.error("Error parsing transaction data:", error);
          showToast("Error fetching data", "error");
        }
      },
      onerror: function (error) {
        console.error("Error fetching transaction data:", error);
        showToast("Error connecting to service", "error");
      },
    });
  }

  function checkTransaction(dest) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${apiBase}/trx?dest=${dest}`,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          if (data && data.length > 0) {
            displayTransactionModal(data);
          } else {
            showToast("No transaction data found", "error");
          }
        } catch (error) {
          console.error("Error parsing transaction data:", error);
          showToast("Error fetching transaction data", "error");
        }
      },
      onerror: function (error) {
        console.error("Error fetching transaction data:", error);
        showToast("Error connecting to transaction service", "error");
      },
    });
  }

  function checkDeposit(identifier) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${apiBase}/deposit?identifier=${identifier}`,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          if (data && data.length > 0) {
            displayDepositModal(data);
          } else {
            showToast("No deposit data found", "error");
          }
        } catch (error) {
          console.error("Error parsing deposit data:", error);
          showToast("Error fetching deposit data", "error");
        }
      },
      onerror: function (error) {
        console.error("Error fetching deposit data:", error);
        showToast("Error connecting to deposit service", "error");
      },
    });
  }

  function checkVerification(agentCode) {
    const VERIFY_SESSION = unsafeWindow.verify_session || "";
    
    if (!VERIFY_SESSION) {
      showToast("No verification session configured", "error");
      displayVerificationModal([], agentCode);
      return;
    }

    // Use server endpoint instead of direct calls
    GM_xmlhttpRequest({
      method: "GET",
      url: `${apiBase}/user/${agentCode}?session=${VERIFY_SESSION}`,
      onload: function (response) {
        try {
          const results = JSON.parse(response.responseText);
          displayVerificationModal(results, agentCode);
        } catch (error) {
          console.error("Error parsing verification data:", error);
          showToast("Error fetching verification data", "error");
          displayVerificationModal([], agentCode);
        }
      },
      onerror: function (error) {
        console.error("Error fetching verification data:", error);
        showToast("Error connecting to verification service", "error");
        displayVerificationModal([], agentCode);
      },
    });
  }

  function showImageOverlay(imageUrl) {
    const overlay = document.createElement("div");
    overlay.className = "userscript-modal";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10002;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    `;

    const container = document.createElement("div");
    container.style.cssText = `
      position: relative;
      max-width: 90%;
      max-height: 90%;
    `;

    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      display: block;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.title = "Close (Esc)";
    closeBtn.style.cssText = `
      position: absolute;
      top: -15px;
      right: -15px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = "#d32f2f";
    closeBtn.onmouseout = () => closeBtn.style.background = "#f44336";

    container.appendChild(img);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const closeOverlay = () => {
      overlay.remove();
      document.removeEventListener("keydown", escapeHandler);
      window.closeUserscriptModal = null;
    };

    window.closeUserscriptModal = closeOverlay;

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeOverlay();
    };

    overlay.onclick = closeOverlay;
    
    container.onclick = (e) => {
      e.stopPropagation();
    };
    
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        closeOverlay();
      }
    };
    
    const blurHandler = (event) => {
      if (!overlay.contains(event.relatedTarget)) {
        closeOverlay();
      }
    };
    
    overlay.setAttribute("tabindex", "-1");
    overlay.addEventListener("blur", blurHandler, true);
    document.addEventListener("keydown", escapeHandler);
    
    requestAnimationFrame(() => {
      overlay.focus();
    });
  }

  function displayVerificationModal(data, agentCode) {
    const modal = document.createElement("div");
    modal.id = "verificationModal";
    modal.className = "userscript-modal";
    modal.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: white;
      padding: 20px;
      z-index: 10001;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
      max-height: 85vh;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;

    const header = document.createElement("h3");
    header.innerText = `Verification for ${agentCode}`;
    header.style.cssText = `
      margin: 0 0 15px 0;
      color: black;
      font-size: 18px;
    `;
    modal.appendChild(header);

    if (!data || data.length === 0) {
      const noDataMsg = document.createElement("p");
      noDataMsg.innerText = "No verification data found for this agent.";
      noDataMsg.style.cssText = `
        color: #666;
        font-size: 14px;
        text-align: center;
        padding: 20px;
      `;
      modal.appendChild(noDataMsg);
    } else {
      const table = document.createElement("table");
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        color: black;
        background-color: white;
        table-layout: fixed;
      `;

      const headers = ["Agent Code", "Type", "Status", "Image", ""];
      const headerRow = document.createElement("tr");
      const columnWidths = ["20%", "15%", "25%", "30%", "10%"];

      headers.forEach((headerText, index) => {
        const th = document.createElement("th");
        th.innerText = headerText;
        th.style.cssText = `
          border: 1px solid #ccc;
          padding: 6px 8px;
          color: black;
          font-size: 13px;
          width: ${columnWidths[index]};
          word-wrap: break-word;
          overflow-wrap: break-word;
        `;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      data.forEach((row) => {
        const tr = document.createElement("tr");

        const rowData = [
          row.agentCode || "",
          row.type || "",
          row.status || "",
        ];

        rowData.forEach((cellData, index) => {
          const td = document.createElement("td");
          td.innerText = cellData;
          td.setAttribute("tabindex", "0");
          td.setAttribute("role", "button");
          td.style.cssText = `
            border: 1px solid #ccc;
            padding: 6px 8px;
            color: black;
            font-size: 12px;
            width: ${columnWidths[index]};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
            cursor: pointer;
            transition: background 0.2s;
          `;
          td.title = "Click to copy";
          td.onclick = () => {
            navigator.clipboard
              .writeText(cellData)
              .catch((error) => console.error("Error copying cell:", error));
            closeModal();
          };
          td.onmouseenter = () => {
            td.style.background = "#f0f0f0";
          };
          td.onmouseleave = () => {
            td.style.background = "";
          };
          tr.appendChild(td);
        });

        // Image cell
        const imageCell = document.createElement("td");
        imageCell.style.cssText = `
          border: 1px solid #ccc;
          padding: 6px 8px;
          width: ${columnWidths[3]};
          text-align: center;
        `;
        
        if (row.imageUrl) {
          const container = document.createElement("div");
          container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
          `;
          
          const img = document.createElement("img");
          img.src = row.imageUrl;
          img.style.cssText = `
            max-width: 100%;
            max-height: 60px;
            cursor: pointer;
            border-radius: 4px;
          `;
          img.onclick = () => {
            showImageOverlay(row.imageUrl);
          };
          img.title = "Click to view full size";
          
          const viewBtn = document.createElement("button");
          viewBtn.innerText = "🖼️ View Full";
          viewBtn.title = "View full size image";
          viewBtn.style.cssText = `
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
          `;
          viewBtn.onmouseover = () => viewBtn.style.background = "#1976D2";
          viewBtn.onmouseout = () => viewBtn.style.background = "#2196F3";
          viewBtn.onclick = (e) => {
            e.stopPropagation();
            showImageOverlay(row.imageUrl);
          };
          
          container.appendChild(img);
          container.appendChild(viewBtn);
          imageCell.appendChild(container);
        } else {
          imageCell.innerText = "-";
        }
        tr.appendChild(imageCell);

        // Action buttons cell
        const verifyCell = document.createElement("td");
        verifyCell.style.cssText = `
          border: 1px solid #ccc;
          padding: 4px;
          width: ${columnWidths[4]};
          text-align: center;
        `;
        
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 4px;
        `;
        
        // Verify button
        const verifyBtn = document.createElement("button");
        const isVerified = row.status && (row.status.toLowerCase().includes('verified') || row.status === 'Verified');
        
        if (isVerified) {
          verifyBtn.innerText = "✅";
          verifyBtn.title = "Already Verified";
          verifyBtn.disabled = true;
          verifyBtn.style.cssText = `
            background: #9E9E9E;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 7px;
            font-size: 18px;
            cursor: not-allowed;
            width: 100%;
            opacity: 0.6;
          `;
        } else {
          verifyBtn.innerText = "✅";
          verifyBtn.title = "Verify User";
          verifyBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 7px;
            font-size: 18px;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
          `;

          verifyBtn.onclick = () => {
            if (!row.verificationId) {
              showToast("No verification ID found", "error");
              return;
            }

            const VERIFY_SESSION = unsafeWindow.verify_session || "";
            
            if (!VERIFY_SESSION) {
              showToast("No verification session configured", "error");
              return;
            }
            
            verifyBtn.disabled = true;
            verifyBtn.innerText = "⏳";

            // Use server endpoint for verification
            GM_xmlhttpRequest({
              method: "POST",
              url: `${apiBase}/verify`,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              data: `id=${row.verificationId}&agentCode=${encodeURIComponent(row.agentCode)}&session=${VERIFY_SESSION}`,
              onload: function (response) {
                try {
                  const result = JSON.parse(response.responseText);
                  if (result.success) {
                    verifyBtn.innerText = "✅";
                    verifyBtn.style.background = "#9E9E9E";
                    verifyBtn.style.cursor = "not-allowed";
                    verifyBtn.title = "Already Verified";
                    
                    let message = "User verified successfully!";
                    if (result.levelUpdate) {
                      message += ` Level updated: ${result.levelUpdate.oldLevel} → ${result.levelUpdate.newLevel}`;
                    }
                    showToast(message, "success");
                    
                    setTimeout(() => {
                      closeModal();
                    }, 1000);
                  } else {
                    verifyBtn.innerText = "❌";
                    showToast("Verification failed", "error");
                    setTimeout(() => {
                      verifyBtn.innerText = "✅";
                      verifyBtn.disabled = false;
                    }, 2000);
                  }
                } catch (error) {
                  console.error("Error parsing verification response:", error);
                  verifyBtn.innerText = "❌";
                  showToast("Error verifying user", "error");
                  setTimeout(() => {
                    verifyBtn.innerText = "✅";
                    verifyBtn.disabled = false;
                  }, 2000);
                }
              },
              onerror: function (error) {
                console.error("Error verifying user:", error);
                verifyBtn.innerText = "❌";
                showToast("Error verifying user", "error");
                setTimeout(() => {
                  verifyBtn.innerText = "✅";
                  verifyBtn.disabled = false;
                }, 2000);
              },
            });
          };
        }
        
        buttonContainer.appendChild(verifyBtn);
        
        // Unlock session button
        const unlockBtn = document.createElement("button");
        unlockBtn.innerText = "🔓";
        unlockBtn.title = "Unlock Session";
        unlockBtn.style.cssText = `
          background: #FF9800;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 5px 7px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
        `;
        
        unlockBtn.onclick = () => {
          const VERIFY_SESSION = unsafeWindow.verify_session || "";
          
          if (!VERIFY_SESSION) {
            showToast("No verification session configured", "error");
            return;
          }
          
          unlockBtn.disabled = true;
          unlockBtn.innerText = "⏳";
          
          // Use server endpoint for unlock
          GM_xmlhttpRequest({
            method: "POST",
            url: `${apiBase}/unlock-session/${row.agentCode}?session=${VERIFY_SESSION}`,
            onload: function (response) {
              try {
                const result = JSON.parse(response.responseText);
                if (result.success) {
                  unlockBtn.innerText = "✅";
                  showToast("Session unlocked successfully!", "success");
                  setTimeout(() => {
                    unlockBtn.innerText = "🔓";
                    unlockBtn.disabled = false;
                  }, 2000);
                } else {
                  unlockBtn.innerText = "❌";
                  showToast("Failed to unlock session", "error");
                  setTimeout(() => {
                    unlockBtn.innerText = "🔓";
                    unlockBtn.disabled = false;
                  }, 2000);
                }
              } catch (error) {
                console.error("Error parsing unlock response:", error);
                unlockBtn.innerText = "❌";
                showToast("Error unlocking session", "error");
                setTimeout(() => {
                  unlockBtn.innerText = "🔓";
                  unlockBtn.disabled = false;
                }, 2000);
              }
            },
            onerror: function (error) {
              console.error("Error unlocking session:", error);
              unlockBtn.innerText = "❌";
              showToast("Error unlocking session", "error");
              setTimeout(() => {
                unlockBtn.innerText = "🔓";
                unlockBtn.disabled = false;
              }, 2000);
            },
          });
        };
        
        buttonContainer.appendChild(unlockBtn);
        
        // Request reupload button
        const reuploadBtn = document.createElement("button");
        reuploadBtn.innerText = "🔄";
        reuploadBtn.title = "Request Reupload";
        reuploadBtn.style.cssText = `
          background: #9C27B0;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 5px 7px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
        `;
        
        reuploadBtn.onclick = () => {
          if (!row.verificationId) {
            showToast("No verification ID found", "error");
            return;
          }
          
          const VERIFY_SESSION = unsafeWindow.verify_session || "";
          
          if (!VERIFY_SESSION) {
            showToast("No verification session configured", "error");
            return;
          }
          
          reuploadBtn.disabled = true;
          reuploadBtn.innerText = "⏳";
          
          const reason = encodeURIComponent("mohon perbaiki verifikasi sesuai dengan instruksi foto:\nFoto kartu identitas (nampak foto, nama dan alamat)\nFoto selfie sambil memegang kartu identitas");
          
          // Use server endpoint for reupload request
          GM_xmlhttpRequest({
            method: "POST",
            url: `${apiBase}/verify`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            data: `id=${row.verificationId}&agentCode=${encodeURIComponent(row.agentCode)}&status=2&statusktp=2&keterangan=${reason}&session=${VERIFY_SESSION}`,
            onload: function (response) {
              try {
                const result = JSON.parse(response.responseText);
                if (result.success) {
                  reuploadBtn.innerText = "✅";
                  showToast("Reupload requested successfully!", "success");
                  setTimeout(() => {
                    closeModal();
                  }, 1000);
                } else {
                  reuploadBtn.innerText = "❌";
                  showToast("Failed to request reupload", "error");
                  setTimeout(() => {
                    reuploadBtn.innerText = "🔄";
                    reuploadBtn.disabled = false;
                  }, 2000);
                }
              } catch (error) {
                console.error("Error parsing reupload response:", error);
                reuploadBtn.innerText = "❌";
                showToast("Error requesting reupload", "error");
                setTimeout(() => {
                  reuploadBtn.innerText = "🔄";
                  reuploadBtn.disabled = false;
                }, 2000);
              }
            },
            onerror: function (error) {
              console.error("Error requesting reupload:", error);
              reuploadBtn.innerText = "❌";
              showToast("Error requesting reupload", "error");
              setTimeout(() => {
                reuploadBtn.innerText = "🔄";
                reuploadBtn.disabled = false;
              }, 2000);
            },
          });
        };
        
        buttonContainer.appendChild(reuploadBtn);
        verifyCell.appendChild(buttonContainer);
        tr.appendChild(verifyCell);

        table.appendChild(tr);
      });

      modal.appendChild(table);
    }

    function closeModal() {
      modal.style.transform = "translateY(100%)";
      setTimeout(() => {
        modal.remove();
      }, 300);
      document.removeEventListener("keydown", escapeHandler);
      window.closeUserscriptModal = null;
    }
    window.closeUserscriptModal = closeModal;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.style.transform = "translateY(0)";
      modal.focus();
    });

    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }
    
    function blurHandler(event) {
      if (!modal.contains(event.relatedTarget)) {
        closeModal();
      }
    }
    
    modal.setAttribute("tabindex", "-1");
    modal.addEventListener("blur", blurHandler, true);
    document.addEventListener("keydown", escapeHandler);
  }

  // Watch for URL changes (SPA navigation)
  let lastUrl = window.location.href;
  console.log("[TM] Starting URL monitor, initial URL:", lastUrl);
  setInterval(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      console.log("[TM] URL changed to:", lastUrl);
    }
  }, 500);

  document.addEventListener("keydown", function (event) {
    // Detect ONLY Ctrl+R or Cmd+R, no other modifiers
    const isOnlyCtrlR =
      (event.ctrlKey || event.metaKey) && // Ctrl or Cmd
      !event.altKey && // Alt NOT pressed
      !event.shiftKey && // Shift NOT pressed
      !event.getModifierState("AltGraph") && // AltGraph NOT pressed (some keyboard layouts)
      event.key.toLowerCase() === "r";

    if (isOnlyCtrlR) {
      event.preventDefault();

      const btn = document.querySelector(
        ".c-conversation-profile-widget-layout-action--button.c-conversation-profile-widget-layout-action--green",
      );

      if (btn) {
        btn.click();
      } else {
        console.log('[TM] "Ask for rating" button not found.');
      }
    }
  });

  if (!unsafeWindow.disableDetachEditor) {
    // --- Detach Crisp Chatbox Feature ---
    let originalParent = null;
    let originalNextSibling = null;
    let isDetached = false;
    let isHidden = true;

    function isInboxPage() {
      return window.location.pathname.includes("/inbox/");
    }

    function focusInputField() {
      const inputField = document.querySelector(
        ".c-editor-composer__field.o-markdown.c-conversation-box-field__field-composer-field",
      );
      if (inputField) {
        inputField.focus();
      }
    }

    function detachEditor() {
      const editor = document.querySelector(".c-conversation-box__editor");
      const parent = document.querySelector(
        ".c-conversation-box.js-conversation-wrapper.c-conversation-box--default",
      );

      if (!editor || !parent || isDetached) return;

      // Store original position
      originalParent = parent;
      originalNextSibling = editor.nextSibling;

      // Remove from current parent
      editor.remove();

      // Style for bottom positioning
      editor.style.position = "fixed";
      editor.style.bottom = "0";
      editor.style.left = "0";
      editor.style.right = "0";
      editor.style.zIndex = "9999";
      editor.style.backgroundColor = "white";
      editor.style.borderTop = "1px solid #ccc";
      editor.style.display = isHidden ? "none" : "";

      // Append to body
      document.body.appendChild(editor);
      isDetached = true;

      // Focus input field if editor is visible
      if (!isHidden) {
        setTimeout(focusInputField, 50);
      }
    }

    function restoreEditor() {
      const editor = document.querySelector(
        "body > .c-conversation-box__editor",
      );

      if (!editor || !originalParent || !isDetached) return;

      // Reset styles
      editor.style.position = "";
      editor.style.bottom = "";
      editor.style.left = "";
      editor.style.right = "";
      editor.style.zIndex = "";
      editor.style.backgroundColor = "";
      editor.style.borderTop = "";
      editor.style.display = "";

      // Remove from body
      editor.remove();

      // Restore to original position
      if (originalNextSibling) {
        originalParent.insertBefore(editor, originalNextSibling);
      } else {
        originalParent.appendChild(editor);
      }

      isDetached = false;
      isHidden = true; // Reset hidden state for next time
    }

    function toggleEditor() {
      if (!isInboxPage() || !isDetached) return;

      const editor = document.querySelector(
        "body > .c-conversation-box__editor",
      );
      if (editor) {
        isHidden = !isHidden;
        editor.style.display = isHidden ? "none" : "";

        // Focus input field when showing the editor
        if (!isHidden) {
          setTimeout(focusInputField, 50);
        }
      }
    }

    function handleRouteChange() {
      if (isInboxPage()) {
        setTimeout(detachEditor, 100);
      } else {
        restoreEditor();
      }
    }

    // Initial check
    handleRouteChange();

    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        handleRouteChange();
      }
    }, 100);

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      if (isInboxPage() && !isDetached) {
        setTimeout(detachEditor, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Expose toggleEditor function globally for Tridactyl
    window.toggleEditor = toggleEditor;
  }

  function isCrispModsDisabled() {
    return (
      (typeof unsafeWindow !== "undefined" && unsafeWindow.disableCrispMods) ||
      (typeof window !== "undefined" && window.disableCrispMods)
    );
  }

  if (!isCrispModsDisabled()) {
    let sidebarHidden = true; // Initially hidden

    // ---- Change theme color ----
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#b4637a");

    // ---- Change favicon ----
    const newFavicon = "https://www.svgrepo.com/show/194023/message-mail.svg";
    document
      .querySelectorAll('link[rel*="icon"]')
      .forEach((el) => el.parentNode.removeChild(el));
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = newFavicon;
    document.head.appendChild(link);

    // ---- Force sidebar width & add slide animation ----
    const style = document.createElement("style");
    style.innerHTML = `
        .c-conversation-menu.c-inbox-index__menu {
            width: 200px !important;
            min-width: 200px !important;
            max-width: 200px !important;
            flex-basis: 200px !important;
        }
        .c-inbox-conversation__pane {
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out !important;
            overflow: hidden !important;
            transform-origin: right center !important;
        }
        .c-inbox-conversation__pane.sidebar-hidden {
            transform: translateX(100%) !important;
            opacity: 0 !important;
        }
        .sidebar-toggle-btn {
            position: fixed !important;
            top: 50% !important;
            right: 0px !important;
            transform: translateY(-50%) !important;
            z-index: 9999 !important;
            background: #b4637a !important;
            color: white !important;
            border: none !important;
            border-radius: 8px 0 0 8px !important;
            width: 25px !important;
            height: 60px !important;
            cursor: pointer !important;
            box-shadow: -2px 0 8px rgba(0,0,0,0.2) !important;
            font-size: 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
            writing-mode: vertical-rl !important;
            text-orientation: mixed !important;
            font-weight: bold !important;
            letter-spacing: 1px !important;
        }
        .sidebar-toggle-btn:hover {
            background: #9d5568 !important;
            width: 30px !important;
            box-shadow: -3px 0 12px rgba(0,0,0,0.3) !important;
        }
        .sidebar-toggle-btn.pane-hidden {
            right: 0px !important;
        }
        .sidebar-toggle-btn::before {
            content: '' !important;
            position: absolute !important;
            top: -2px !important;
            left: -2px !important;
            right: 0 !important;
            bottom: -2px !important;
            background: linear-gradient(135deg, #b4637a 0%, #9d5568 100%) !important;
            border-radius: 8px 0 0 8px !important;
            z-index: -1 !important;
        }
    `;
    document.head.appendChild(style);

    function createToggleButton() {
      if (document.querySelector(".sidebar-toggle-btn")) return;
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "sidebar-toggle-btn";
      toggleBtn.innerHTML = sidebarHidden ? "Details" : "Hide";
      toggleBtn.title = "Toggle Conversation Pane";
      if (sidebarHidden) {
        toggleBtn.classList.add("pane-hidden");
      }
      toggleBtn.addEventListener("click", toggleSidebar);
      document.body.appendChild(toggleBtn);
    }

    function toggleSidebar() {
      sidebarHidden = !sidebarHidden;
      const toggleBtn = document.querySelector(".sidebar-toggle-btn");
      document.querySelectorAll(".c-inbox-conversation__pane").forEach((el) => {
        if (sidebarHidden) {
          el.classList.add("sidebar-hidden");
          setTimeout(() => {
            if (el.classList.contains("sidebar-hidden")) {
              el.style.setProperty("position", "absolute", "important");
              el.style.setProperty("visibility", "hidden", "important");
            }
          }, 300);
        } else {
          el.style.removeProperty("position");
          el.style.removeProperty("visibility");
          setTimeout(() => {
            el.classList.remove("sidebar-hidden");
          }, 10);
        }
      });
      if (toggleBtn) {
        toggleBtn.innerHTML = sidebarHidden ? "Details" : "Hide";
        if (sidebarHidden) {
          toggleBtn.classList.add("pane-hidden");
        } else {
          toggleBtn.classList.remove("pane-hidden");
        }
      }
    }

    function setupSidebar() {
      document
        .querySelectorAll(".c-conversation-menu.c-inbox-index__menu")
        .forEach((el) => {
          el.style.setProperty("width", "200px", "important");
          el.style.setProperty("min-width", "200px", "important");
          el.style.setProperty("max-width", "200px", "important");
          el.style.setProperty("flex-basis", "200px", "important");
        });
      document.querySelectorAll(".c-inbox-conversation__pane").forEach((el) => {
        if (sidebarHidden) {
          el.classList.add("sidebar-hidden");
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("visibility", "hidden", "important");
        } else {
          el.classList.remove("sidebar-hidden");
          el.style.removeProperty("position");
          el.style.removeProperty("visibility");
        }
      });
      createToggleButton();
    }

    setupSidebar();
    const observer = new MutationObserver(setupSidebar);
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
