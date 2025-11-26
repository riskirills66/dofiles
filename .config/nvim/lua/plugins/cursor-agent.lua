return {
  {
    "akinsho/toggleterm.nvim",
    version = "*",
    lazy = false,
    opts = {
      open_mapping = false,
      hide_numbers = true,
      shade_filetypes = {},
      shade_terminals = true,
      shading_factor = 2,
      start_in_insert = true,
      insert_mappings = true,
      persist_size = false,
      direction = "float",
      close_on_exit = true,
      shell = vim.o.shell,
      float_opts = {
        border = "curved",
        winblend = 0,
        highlights = {
          border = "Normal",
          background = "Normal",
        },
      },
    },
    config = function(_, opts)
      require("toggleterm").setup(opts)

      local Terminal = require("toggleterm.terminal").Terminal

      -- Create a dedicated cursor-agent terminal
      local cursor_agent_term = Terminal:new({
        cmd = "droid",
        hidden = true,
        direction = "vertical",
        auto_scroll = true,
        on_open = function(term)
          -- Force resize the window
          vim.cmd("vertical resize 50")

          -- Ensure we start in insert mode with a slight delay
          vim.defer_fn(function()
            vim.cmd("startinsert!")
          end, 10)

          -- Escape to normal mode
          vim.api.nvim_buf_set_keymap(term.bufnr, "t", "<esc>", "<C-\\><C-n>", { noremap = true, silent = true })

          -- Close terminal
          vim.api.nvim_buf_set_keymap(
            term.bufnr,
            "t",
            "<C-q>",
            "<C-\\><C-n>:close<CR>",
            { noremap = true, silent = true }
          )
        end,
        on_close = function(term)
          vim.cmd("startinsert!")
        end,
      })

      -- Create :Agent command
      vim.api.nvim_create_user_command("Agent", function()
        cursor_agent_term:toggle()
      end, { desc = "Toggle Cursor Agent Terminal" })
    end,
  },
}
