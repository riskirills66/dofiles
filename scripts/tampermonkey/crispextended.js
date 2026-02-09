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
          alert("Error fetching transaction data");
        }
      },
      onerror: function (error) {
        console.error("Error fetching transaction data:", error);
        alert("Error connecting to transaction service");
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
          alert("Error fetching deposit data");
        }
      },
      onerror: function (error) {
        console.error("Error fetching deposit data:", error);
        alert("Error connecting to deposit service");
      },
    });
  }

  function fetchLatestReply(key = "reply:test") {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${replyApi}/reply?token=${SECURE_TOKEN}&key=${encodeURIComponent(key)}`,
      onload: function (response) {
        try {
          const result = JSON.parse(response.responseText);
          if (result.data) {
            // Automatically copy data value to clipboard
            navigator.clipboard
              .writeText(result.data)
              .then(() => {
                console.log("Latest reply copied to clipboard:", result.data);
                // Optional: Show a brief notification
                const notification = document.createElement("div");
                notification.textContent = "Reply copied to clipboard!";
                notification.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #4CAF50;
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
                }, 2000);
              })
              .catch((error) => {
                console.error("Error copying reply to clipboard:", error);
                alert("Error copying to clipboard");
              });
          } else {
            console.log("No data found in reply");
            alert("No data found in reply");
          }
        } catch (error) {
          console.error("Error parsing reply data:", error);
          alert("Error fetching reply data");
        }
      },
      onerror: function (error) {
        console.error("Error fetching reply data:", error);
        alert("Error connecting to reply service");
      },
    });
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
