(function () {
  const API_URL = unsafeWindow.trx_monitor_url || "http://localhost:8040";
  const TG_API_URL = unsafeWindow.tg_api_url || "http://localhost:4040";
  const REPLY_API_URL =
    unsafeWindow.reply_api_url || "http://trxmonitor.hexaloom.com";
  const SECURE_TOKEN =
    unsafeWindow.secure_token || "what-ever-bitch-i-dont-care-123";
  const apiBase = `${API_URL}`;
  const tgApi = `${TG_API_URL}`;
  const replyApi = `${REPLY_API_URL}`;

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
    const bgColor = type === "error" ? "#f44336" : "#4CAF50";
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
    return document.querySelector(".userscript-modal") !== null;
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
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            z-index: 9999;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-height: 80vh;
            overflow-y: auto;
            max-width: 95vw;
            width: 95vw;
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
      "18%",
      "10%",
      "6%",
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

        // Create a container div for cell content and copy button
        const cellContainer = document.createElement("div");
        cellContainer.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        `;

        // Create text span for the cell data
        const textSpan = document.createElement("span");
        textSpan.innerText = cellData;
        textSpan.style.cssText = `
          flex: 1;
          word-wrap: break-word;
          overflow-wrap: break-word;
        `;

        // Create small copy button for each cell
        const cellCopyBtn = document.createElement("button");
        cellCopyBtn.innerText = "📋";
        cellCopyBtn.style.cssText = `
          background: transparent;
          border: none;
          padding: 1px;
          font-size: 10px;
          cursor: pointer;
          opacity: 0.6;
          margin-left: 4px;
          flex-shrink: 0;
        `;
        cellCopyBtn.title = "Copy cell content";
        cellCopyBtn.onclick = (e) => {
          e.stopPropagation();
          navigator.clipboard
            .writeText(cellData)
            .catch((error) => console.error("Error copying cell:", error));
        };

        cellContainer.appendChild(textSpan);
        cellContainer.appendChild(cellCopyBtn);
        td.appendChild(cellContainer);

        td.style.cssText = `
                    border: 1px solid #ccc;
                    padding: 4px 6px;
                    color: black;
                    font-size: 11px;
                    width: ${columnWidths[index]};
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    line-height: 1.2;
                `;
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

    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

    // Function to close modal and cleanup
    function closeModal() {
      modal.remove();
      document.removeEventListener("keydown", escapeHandler);
      document.removeEventListener("click", clickHandler);
      window.closeUserscriptModal = null; // Clear the reference
    }

    // Add global reference for Tridactyl access
    window.closeUserscriptModal = closeModal;

    closeButton.onclick = closeModal;
    modal.appendChild(closeButton);

    document.body.appendChild(modal);

    // Event listeners for closing modal
    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    function clickHandler(event) {
      if (!modal.contains(event.target)) {
        closeModal();
      }
    }

    document.addEventListener("keydown", escapeHandler);
    document.addEventListener("click", clickHandler);
  }

  function displayDepositModal(data) {
    const modal = document.createElement("div");
    modal.id = "depositModal";
    modal.className = "userscript-modal";
    modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            z-index: 9999;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-height: 80vh;
            overflow-y: auto;
            max-width: 90vw;
            width: 90vw;
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

        // Create a container div for cell content and copy button
        const cellContainer = document.createElement("div");
        cellContainer.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        `;

        // Create text span for the cell data
        const textSpan = document.createElement("span");
        textSpan.innerText = cellData;
        textSpan.style.cssText = `
          flex: 1;
          word-wrap: break-word;
          overflow-wrap: break-word;
        `;

        // Create small copy button for each cell
        const cellCopyBtn = document.createElement("button");
        cellCopyBtn.innerText = "📋";
        cellCopyBtn.style.cssText = `
          background: transparent;
          border: none;
          padding: 1px;
          font-size: 10px;
          cursor: pointer;
          opacity: 0.6;
          margin-left: 4px;
          flex-shrink: 0;
        `;
        cellCopyBtn.title = "Copy cell content";
        cellCopyBtn.onclick = (e) => {
          e.stopPropagation();
          navigator.clipboard
            .writeText(cellData)
            .catch((error) => console.error("Error copying cell:", error));
        };

        cellContainer.appendChild(textSpan);
        cellContainer.appendChild(cellCopyBtn);
        td.appendChild(cellContainer);

        td.style.cssText = `
                    border: 1px solid #ccc;
                    padding: 6px 8px;
                    color: black;
                    font-size: 12px;
                    width: ${columnWidths[index]};
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    line-height: 1.3;
                `;
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

    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

    function closeModal() {
      modal.remove();
      document.removeEventListener("keydown", escapeHandler);
      document.removeEventListener("click", clickHandler);
      window.closeUserscriptModal = null;
    }
    window.closeUserscriptModal = closeModal;

    closeButton.onclick = closeModal;
    modal.appendChild(closeButton);

    document.body.appendChild(modal);

    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }
    function clickHandler(event) {
      if (!modal.contains(event.target)) {
        closeModal();
      }
    }
    document.addEventListener("keydown", escapeHandler);
    document.addEventListener("click", clickHandler);
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

      if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
      }

      selectedIndex = 0;
      menuItems = [];

      contextMenu = document.createElement("div");
      contextMenu.style.cssText = `
                position: fixed;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10000;
                padding: 5px 0;
                min-width: 150px;
                visibility: hidden;
            `;

      const trxItem = document.createElement("div");
      trxItem.textContent = "Cek Transaksi";
      trxItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                color: black;
                background-color: #f0f0f0;
                transition: background 0.1s;
            `;
      trxItem.onmouseover = () => {
        updateSelectedItem(0);
      };
      trxItem.onclick = () => {
        contextMenu.remove();
        contextMenu = null;
        checkTransaction(selectedText);
      };

      const depositItem = document.createElement("div");
      depositItem.textContent = "Cek Deposit";
      depositItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                color: black;
                transition: background 0.1s;
            `;
      depositItem.onmouseover = () => {
        updateSelectedItem(1);
      };
      depositItem.onclick = () => {
        contextMenu.remove();
        contextMenu = null;
        checkDeposit(selectedText);
      };

      const botReplyItem = document.createElement("div");
      botReplyItem.textContent = "Bot Reply";
      botReplyItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                color: black;
                transition: background 0.1s;
            `;
      botReplyItem.onmouseover = () => {
        updateSelectedItem(2);
      };
      botReplyItem.onclick = () => {
        contextMenu.remove();
        contextMenu = null;
        fetchLatestReply(selectedText);
      };

      contextMenu.appendChild(trxItem);
      contextMenu.appendChild(depositItem);
      contextMenu.appendChild(botReplyItem);

      menuItems = [trxItem, depositItem, botReplyItem];

      document.body.appendChild(contextMenu);

      // Get menu dimensions after appending to DOM to ensure accurate sizing
      const menuRect = contextMenu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Define margin from edges
      const edgeMargin = 10; // 10px margin from edge

      let x = e.clientX;
      let y = e.clientY;

      // Adjust horizontal position if too close to right edge
      if (x + menuRect.width > viewportWidth - edgeMargin) {
        x = viewportWidth - menuRect.width - edgeMargin;
      }

      // Adjust vertical position if too close to bottom edge
      if (y + menuRect.height > viewportHeight - edgeMargin) {
        y = viewportHeight - menuRect.height - edgeMargin;
      }

      // Ensure menu doesn't go off left or top edge
      if (x < edgeMargin) {
        x = edgeMargin;
      }
      if (y < edgeMargin) {
        y = edgeMargin;
      }

      contextMenu.style.left = x + "px";
      contextMenu.style.top = y + "px";
      contextMenu.style.visibility = "visible";

      contextMenu.setAttribute("tabindex", "-1");
      contextMenu.focus();

      updateSelectedItem(selectedIndex);
    }
  });

  function updateSelectedItem(index) {
    if (menuItems.length === 0) return;
    menuItems.forEach((item) => {
      item.style.background = "";
    });
    selectedIndex = index;
    menuItems[selectedIndex].style.background =
      "linear-gradient(rgba(255,255,255,0.8),rgba(255,255,255,0.5)), #f0f0f0";
  }
  function executeSelectedItem() {
    if (menuItems.length === 0 || !contextMenu) return;
    contextMenu.remove();
    contextMenu = null;
    if (selectedIndex === 0) {
      checkTransaction(selectedText);
    } else if (selectedIndex === 1) {
      checkDeposit(selectedText);
    } else if (selectedIndex === 2) {
      fetchLatestReply(selectedText);
    }
  }
  document.addEventListener("keydown", function (e) {
    if (
      !contextMenu ||
      !document.body.contains(contextMenu) ||
      isAnyModalOpen()
    )
      return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % menuItems.length;
        updateSelectedItem(selectedIndex);
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex =
          selectedIndex === 0 ? menuItems.length - 1 : selectedIndex - 1;
        updateSelectedItem(selectedIndex);
        break;
      case "Enter":
        e.preventDefault();
        executeSelectedItem();
        break;
      case "Escape":
        e.preventDefault();
        if (contextMenu) {
          contextMenu.remove();
          contextMenu = null;
        }
        break;
    }
  });
  document.addEventListener("click", function (e) {
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.remove();
      contextMenu = null;
    }
  });

  function checkTransaction(dest) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${apiBase}/trx?dest=${dest}`,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          displayTransactionModal(data);
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
          displayDepositModal(data);
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

  function fetchLatestReply(key = "reply:test") {
    console.log("[TM] fetchLatestReply - Fetching reply for key:", key);
    GM_xmlhttpRequest({
      method: "GET",
      url: `${replyApi}/reply?token=${SECURE_TOKEN}&key=${encodeURIComponent(key)}`,
      onload: function (response) {
        console.log("[TM] fetchLatestReply - Response status:", response.status);
        console.log("[TM] fetchLatestReply - Response text:", response.responseText);
        console.log("[TM] fetchLatestReply - Response text length:", response.responseText.length);
        
        // Check if response is not OK (404, 500, etc.)
        if (response.status !== 200) {
          console.log("[TM] fetchLatestReply - Non-200 status, treating as error");
          showToast(`Key not found: ${response.responseText}`, "error");
          return;
        }
        
        try {
          const result = JSON.parse(response.responseText);
          console.log("[TM] fetchLatestReply - Parsed result:", result);
          
          if (result.data) {
            // Automatically copy data value to clipboard
            navigator.clipboard
              .writeText(result.data)
              .then(() => {
                console.log("[TM] Latest reply copied to clipboard:", result.data);
                showToast("Reply copied to clipboard!", "success");
              })
              .catch((error) => {
                console.error("[TM] Error copying reply to clipboard:", error);
                showToast("Error copying to clipboard", "error");
              });
          } else {
            console.log("[TM] No data found in reply");
            showToast("No data found in reply", "error");
          }
        } catch (error) {
          console.error("[TM] Error parsing reply data:", error);
          console.error("[TM] Raw response that failed to parse:", response.responseText);
          // If it's not JSON, treat the response text as the actual reply
          if (response.responseText && response.responseText.trim()) {
            navigator.clipboard
              .writeText(response.responseText)
              .then(() => {
                console.log("[TM] Plain text reply copied to clipboard:", response.responseText);
                showToast("Reply copied to clipboard!", "success");
              })
              .catch((error) => {
                console.error("[TM] Error copying plain text reply:", error);
                showToast("Error copying to clipboard", "error");
              });
          } else {
            showToast("Error fetching reply data", "error");
          }
        }
      },
      onerror: function (error) {
        console.error("[TM] Error fetching reply data:", error);
        showToast("Error connecting to reply service", "error");
      },
    });
  }

  // Extract session ID from current URL
  function getSessionIdFromUrl() {
    const urlMatch = window.location.href.match(/\/inbox\/session_([a-f0-9-]+)/);
    console.log("[TM] getSessionIdFromUrl - URL:", window.location.href);
    console.log("[TM] getSessionIdFromUrl - Match:", urlMatch);
    return urlMatch ? urlMatch[1] : null;
  }

  // Fetch fingerprint keys from Crisp API
  function fetchFingerprintKeys() {
    console.log("[TM] fetchFingerprintKeys - Starting...");
    const sessionId = getSessionIdFromUrl();
    
    if (!sessionId) {
      console.log("[TM] fetchFingerprintKeys - No session ID found");
      showToast("No session ID found in URL", "error");
      return;
    }

    const websiteId = "1e652069-9ee7-4c7f-84df-49a6f33c8efd";
    const fullSessionId = `session_${sessionId}`;
    const apiUrl = `https://api.crisp.chat/v1/website/${websiteId}/conversation/${fullSessionId}/messages`;
    
    console.log("[TM] fetchFingerprintKeys - API URL:", apiUrl);
    
    // Credentials for Basic Auth
    const username = "24ee9d46-e379-4964-81eb-d6c4a1c2e3dd";
    const password = "ebb4fd9f1930b187ac94284fd4540c40f10990be69c21965ca617adaeb029a8b";
    const basicAuth = btoa(`${username}:${password}`);

    console.log("[TM] fetchFingerprintKeys - Making GM_xmlhttpRequest...");
    
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl,
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "X-Crisp-Tier": "plugin"
      },
      onload: function (response) {
        console.log("[TM] fetchFingerprintKeys - Response received:", response.status);
        console.log("[TM] fetchFingerprintKeys - Response text:", response.responseText);
        try {
          const data = JSON.parse(response.responseText);
          console.log("[TM] fetchFingerprintKeys - Parsed data:", data);
          const fingerprintKeys = parseFingerprintKeys(data);
          console.log("[TM] fetchFingerprintKeys - Fingerprint keys:", fingerprintKeys);
          
          if (fingerprintKeys.length > 0) {
            displayFingerprintKeys(fingerprintKeys);
            showToast(`Showing latest ${fingerprintKeys.length} fingerprint key(s)`, "success");
          } else {
            showToast("No fingerprint keys found", "error");
          }
        } catch (error) {
          console.error("[TM] Error parsing fingerprint data:", error);
          showToast("Error fetching fingerprint data", "error");
        }
      },
      onerror: function (error) {
        console.error("[TM] Error fetching fingerprint data:", error);
        showToast("Error connecting to Crisp API", "error");
      },
    });
  }

  // Parse fingerprint keys from API response
  function parseFingerprintKeys(data) {
    const fingerprintKeys = [];
    
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach((message, index) => {
        // Check for fingerprint field directly in message object
        // Only include messages from users (exclude operator messages)
        if (message.fingerprint !== undefined && message.fingerprint !== null && message.from === "user") {
          fingerprintKeys.push(String(message.fingerprint));
          console.log(`[TM] Message ${index}: fingerprint=${message.fingerprint}, timestamp=${message.timestamp}, from=${message.from}`);
        }
      });
    }
    
    console.log("[TM] parseFingerprintKeys - Total user fingerprints collected:", fingerprintKeys.length);
    console.log("[TM] parseFingerprintKeys - All fingerprints in order:", fingerprintKeys);
    
    // Remove duplicates and get only the last 3 (since API returns oldest first)
    const uniqueKeys = [...new Set(fingerprintKeys)];
    console.log("[TM] parseFingerprintKeys - Unique user fingerprints:", uniqueKeys.length);
    console.log("[TM] parseFingerprintKeys - Unique fingerprints:", uniqueKeys);
    
    const latest3 = uniqueKeys.slice(-3).reverse(); // Get last 3 and reverse to show newest first
    console.log("[TM] parseFingerprintKeys - Latest 3 user fingerprints:", latest3.length, latest3);
    
    return latest3;
  }

  // Display fingerprint keys floating on screen
  function displayFingerprintKeys(keys) {
    // Remove existing fingerprint display if any
    const existingDisplay = document.getElementById("fingerprint-display");
    if (existingDisplay) {
      existingDisplay.remove();
    }

    const container = document.createElement("div");
    container.id = "fingerprint-display";
    container.className = "userscript-modal";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      color: black;
      padding: 6px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      max-width: 350px;
      font-family: monospace;
      border: 1px solid #ddd;
    `;

    keys.forEach((key, index) => {
      const keyRow = document.createElement("div");
      keyRow.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f5f5f5;
        padding: 4px 6px;
        margin-bottom: ${index === keys.length - 1 ? '0' : '3px'};
        border-radius: 3px;
        transition: all 0.2s;
      `;
      keyRow.onmouseover = () => {
        keyRow.style.background = "#e8e8e8";
      };
      keyRow.onmouseout = () => {
        keyRow.style.background = "#f5f5f5";
      };

      const keyText = document.createElement("span");
      keyText.textContent = key;
      keyText.style.cssText = `
        flex: 1;
        word-break: break-all;
        font-size: 11px;
        margin-right: 6px;
      `;

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "📋";
      copyBtn.style.cssText = `
        background: #fff;
        border: 1px solid #ddd;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;
      copyBtn.onmouseover = () => {
        copyBtn.style.background = "#f0f0f0";
      };
      copyBtn.onmouseout = () => {
        copyBtn.style.background = "#fff";
      };
      copyBtn.onclick = () => {
        // Fetch bot reply using the fingerprint key
        copyBtn.textContent = "⏳";
        fetchLatestReply(key);
        
        // Reset button after a delay
        setTimeout(() => {
          copyBtn.textContent = "📋";
        }, 2000);
      };

      keyRow.appendChild(keyText);
      keyRow.appendChild(copyBtn);
      container.appendChild(keyRow);
    });

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
      margin-top: 4px;
      padding: 2px 6px;
      background: #fff;
      color: #666;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
      transition: all 0.2s;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.background = "#f0f0f0";
    };
    closeButton.onmouseout = () => {
      closeButton.style.background = "#fff";
    };

    function closeDisplay() {
      container.remove();
      document.removeEventListener("keydown", escapeHandler);
      window.closeFingerprintDisplay = null;
    }

    window.closeFingerprintDisplay = closeDisplay;
    closeButton.onclick = closeDisplay;
    container.appendChild(closeButton);

    document.body.appendChild(container);

    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeDisplay();
      }
    }

    document.addEventListener("keydown", escapeHandler);
  }

  // Clipboard listener for automatic bot reply when modal is displayed
  document.addEventListener("copy", function (event) {
    // Check if the Crisp modal is displayed
    const crispModal = document.querySelector(".c-base-popup__container");
    
    if (crispModal) {
      // Get the copied text
      const copiedText = window.getSelection().toString().trim();
      
      if (copiedText) {
        console.log("[TM] Text copied with modal displayed:", copiedText);
        
        // Extract alphanumeric characters only (similar to context menu logic)
        const match = copiedText.match(/[a-zA-Z0-9]+/g);
        const cleanedText = match ? match.join("") : copiedText;
        
        // Automatically fetch bot reply based on copied text
        setTimeout(() => {
          fetchLatestReply(cleanedText);
        }, 100); // Small delay to ensure copy operation completes
      }
    }
  });

  // Auto-trigger fingerprint fetch on page load and URL changes
  function isInboxPage() {
    const result = window.location.pathname.includes("/inbox/session_");
    console.log("[TM] isInboxPage - pathname:", window.location.pathname, "result:", result);
    return result;
  }

  function autoFetchFingerprints() {
    console.log("[TM] autoFetchFingerprints - Called");
    if (isInboxPage()) {
      const sessionId = getSessionIdFromUrl();
      console.log("[TM] autoFetchFingerprints - Session ID:", sessionId);
      if (sessionId) {
        console.log("[TM] Auto-fetching fingerprints for session:", sessionId);
        fetchFingerprintKeys();
      } else {
        console.log("[TM] autoFetchFingerprints - No session ID found, skipping");
      }
    } else {
      console.log("[TM] autoFetchFingerprints - Not on inbox page, skipping");
    }
  }

  // Initial check on page load
  console.log("[TM] Script loaded, scheduling initial autoFetchFingerprints in 1 second");
  setTimeout(autoFetchFingerprints, 1000);

  // Watch for URL changes (SPA navigation)
  let lastUrl = window.location.href;
  console.log("[TM] Starting URL monitor, initial URL:", lastUrl);
  setInterval(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      console.log("[TM] URL changed to:", lastUrl);
      setTimeout(autoFetchFingerprints, 500);
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

    // Detect Ctrl+Shift+B or Cmd+Shift+B to fetch latest bot reply
    const isCtrlShiftB =
      (event.ctrlKey || event.metaKey) && // Ctrl or Cmd
      event.shiftKey && // Shift pressed
      !event.altKey && // Alt NOT pressed
      event.key.toLowerCase() === "b";

    if (isCtrlShiftB) {
      event.preventDefault();
      fetchLatestReply();
    }

    // Detect Ctrl+Shift+F or Cmd+Shift+F to fetch fingerprint keys
    const isCtrlShiftF =
      (event.ctrlKey || event.metaKey) && // Ctrl or Cmd
      event.shiftKey && // Shift pressed
      !event.altKey && // Alt NOT pressed
      event.key.toLowerCase() === "f";

    if (isCtrlShiftF) {
      event.preventDefault();
      fetchFingerprintKeys();
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
