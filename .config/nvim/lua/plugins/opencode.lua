return {
  "nickjvandyke/opencode.nvim",
  version = "*",
  dependencies = {
    { "folke/snacks.nvim", opts = { input = {}, picker = {}, terminal = {} } },
  },
  config = function()
    -- Store terminal buffer and window IDs
    local opencode_buf = nil
    local opencode_win = nil
    local term_job = nil

    -- Function to create floating window (centered, smaller like lazygit)
    local function create_float_window()
      local width = math.floor(vim.o.columns * 0.7)
      local height = math.floor(vim.o.lines * 0.8)
      local col = math.floor((vim.o.columns - width) / 2)
      local row = math.floor((vim.o.lines - height) / 2) - 1

      -- Reuse existing buffer if available
      local buf = opencode_buf
      if not buf or not vim.api.nvim_buf_is_valid(buf) then
        buf = vim.api.nvim_create_buf(false, false)
      end

      local win_opts = {
        relative = "editor",
        width = width,
        height = height,
        col = col,
        row = row,
        style = "minimal",
        border = "rounded",
        title = " OpenCode ",
        title_pos = "center",
      }

      local win = vim.api.nvim_open_win(buf, true, win_opts)

      -- Set window options
      vim.api.nvim_set_option_value("number", false, { win = win })
      vim.api.nvim_set_option_value("relativenumber", false, { win = win })

      return buf, win
    end

    -- Function to open opencode
    local function opencode_open()
      if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
        vim.api.nvim_set_current_win(opencode_win)
        return
      end

      -- Reuse existing buffer/terminal if available
      if opencode_buf and vim.api.nvim_buf_is_valid(opencode_buf) and term_job then
        opencode_buf, opencode_win = create_float_window()
        vim.api.nvim_win_set_buf(opencode_win, opencode_buf)
        vim.cmd("startinsert")
        return
      end

      opencode_buf, opencode_win = create_float_window()

      -- Start terminal
      term_job = vim.fn.jobstart("opencode --port", {
        term = true,
        on_exit = function()
          opencode_buf = nil
          opencode_win = nil
          term_job = nil
        end,
      })

      -- Setup terminal keymaps
      vim.keymap.set("n", "q", function()
        if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
          vim.api.nvim_win_hide(opencode_win)
          opencode_win = nil
        end
      end, { buffer = opencode_buf, desc = "Hide OpenCode" })

      vim.keymap.set("n", "<Esc>", function()
        if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
          vim.api.nvim_win_hide(opencode_win)
          opencode_win = nil
        end
      end, { buffer = opencode_buf, desc = "Hide OpenCode" })

      -- Ctrl+w in terminal mode to go to normal mode
      vim.keymap.set("t", "<C-w>", "<C-\\><C-n>", { buffer = opencode_buf, desc = "Exit terminal insert mode" })

      -- Enter insert mode
      vim.cmd("startinsert")
    end

    -- Function to toggle opencode
    local function opencode_toggle()
      if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
        vim.api.nvim_win_hide(opencode_win)
        opencode_win = nil
      else
        opencode_open()
      end
    end

    -- Create user command
    vim.api.nvim_create_user_command("OpenCode", function()
      opencode_toggle()
    end, { desc = "Toggle OpenCode floating window" })

    -- Keymaps
    vim.keymap.set("n", "<C-.>", opencode_toggle, { desc = "Toggle OpenCode" })
    vim.keymap.set("t", "<C-.>", opencode_toggle, { desc = "Toggle OpenCode" })
    vim.keymap.set("n", "<leader>go", opencode_toggle, { desc = "Toggle OpenCode" })

    -- Configure opencode.nvim to use our custom toggle
    vim.g.opencode_opts = {
      server = {
        port = nil,
        start = opencode_open,
        stop = function()
          if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
            vim.api.nvim_win_hide(opencode_win)
          end
          if term_job then
            vim.fn.jobstop(term_job)
            opencode_buf = nil
            opencode_win = nil
            term_job = nil
          end
        end,
        toggle = opencode_toggle,
      },
    }

    vim.o.autoread = true

    -- Ask keymap - simplified version
    vim.keymap.set({ "n", "x" }, "<C-a>", function()
      -- Get visual selection or current line
      local text = ""
      local mode = vim.fn.mode()

      if mode == "v" or mode == "V" or mode == "\22" then
        -- Visual mode - get selection
        local start_pos = vim.fn.getpos("'<")
        local end_pos = vim.fn.getpos("'>")
        local lines = vim.fn.getline(start_pos[2], end_pos[2])
        if #lines > 0 then
          if #lines == 1 then
            text = lines[1]:sub(start_pos[3], end_pos[3])
          else
            lines[1] = lines[1]:sub(start_pos[3])
            lines[#lines] = lines[#lines]:sub(1, end_pos[3])
            text = table.concat(lines, "\n")
          end
        end
        vim.cmd("normal! \27") -- Exit visual mode
      else
        -- Normal mode - get current line
        text = vim.fn.getline(".")
      end

      -- Open opencode if not open
      if not opencode_win or not vim.api.nvim_win_is_valid(opencode_win) then
        opencode_open()
      else
        vim.api.nvim_set_current_win(opencode_win)
      end

      -- Send text to opencode terminal
      vim.defer_fn(function()
        if term_job then
          local prompt = "@this: " .. text:gsub("\n", " ") .. "\n"
          vim.fn.chansend(term_job, prompt)
        end
      end, 100)
    end, { desc = "Ask OpenCode about selection" })

    -- Operator keymap
    vim.keymap.set({ "n", "x" }, "go", function()
      local mode = vim.fn.mode()
      if mode ~= "n" then
        vim.cmd([[normal! <Esc>]])
      end

      return "v:lua.opencode_operator()"
    end, { desc = "OpenCode operator", expr = true })

    -- Define the operator function globally
    _G.opencode_operator = function()
      local start_pos = vim.fn.getpos("'[")
      local end_pos = vim.fn.getpos("']")
      local lines = vim.fn.getline(start_pos[2], end_pos[2])

      local text = ""
      if #lines > 0 then
        if #lines == 1 then
          text = lines[1]:sub(start_pos[3], end_pos[3])
        else
          lines[1] = lines[1]:sub(start_pos[3])
          lines[#lines] = lines[#lines]:sub(1, end_pos[3])
          text = table.concat(lines, "\n")
        end
      end

      -- Open opencode
      if not opencode_win or not vim.api.nvim_win_is_valid(opencode_win) then
        opencode_open()
      else
        vim.api.nvim_set_current_win(opencode_win)
      end

      -- Send text
      vim.defer_fn(function()
        if term_job then
          local prompt = "@this: " .. text:gsub("\n", " ") .. "\n"
          vim.fn.chansend(term_job, prompt)
        end
      end, 100)

      return ""
    end

    -- Line operator
    vim.keymap.set("n", "goo", function()
      local line = vim.fn.getline(".")

      if not opencode_win or not vim.api.nvim_win_is_valid(opencode_win) then
        opencode_open()
      else
        vim.api.nvim_set_current_win(opencode_win)
      end

      vim.defer_fn(function()
        if term_job then
          vim.fn.chansend(term_job, "@this: " .. line .. "\n")
        end
      end, 100)
    end, { desc = "Ask OpenCode about current line" })

    -- Scroll keymaps
    vim.keymap.set("n", "<S-C-u>", function()
      if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
        vim.api.nvim_win_call(opencode_win, function()
          vim.cmd([[normal! <C-u>]])
        end)
      end
    end, { desc = "Scroll OpenCode up" })

    vim.keymap.set("n", "<S-C-d>", function()
      if opencode_win and vim.api.nvim_win_is_valid(opencode_win) then
        vim.api.nvim_win_call(opencode_win, function()
          vim.cmd([[normal! <C-d>]])
        end)
      end
    end, { desc = "Scroll OpenCode down" })

    -- Copy filename with line range (gso)
    -- Works in both normal mode (current line only) and visual mode (selected range)
    vim.keymap.set({ "n", "x" }, "gso", function()
      local start_line, end_line
      local mode = vim.fn.mode()

      if mode == "v" or mode == "V" or mode == "\22" then
        -- Visual mode - get selection range
        local start_pos = vim.fn.getpos("'<")
        local end_pos = vim.fn.getpos("'>")
        start_line = start_pos[2]
        end_line = end_pos[2]
        vim.cmd("normal! \27") -- Exit visual mode
      else
        -- Normal mode - use current line
        start_line = vim.fn.line(".")
        end_line = start_line
      end

      -- Get relative path from current working directory
      local filepath = vim.fn.expand("%:.")
      if filepath == "" then
        filepath = "[No Name]"
      end

      -- Format the text
      local result
      if start_line == end_line then
        result = string.format("%s ln %d", filepath, start_line)
      else
        result = string.format("%s ln %d:%d", filepath, start_line, end_line)
      end

      -- Copy to clipboard
      vim.fn.setreg("+", result)
      vim.fn.setreg("\"", result)

      -- Notify user
      vim.notify("Copied: " .. result, vim.log.levels.INFO)
    end, { desc = "Copy filepath with line range" })
  end,
}
