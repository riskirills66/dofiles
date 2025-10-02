---@type LazySpec
return {
  "nvim-telescope/telescope.nvim", -- We'll use telescope for terminal integration
  event = "VeryLazy",
  config = function()
    -- Create the CursorAgent command
    vim.api.nvim_create_user_command("Agent", function()
      -- Check if cursor-agent is available
      if vim.fn.executable("cursor-agent") == 0 then
        vim.notify("cursor-agent not found in PATH", vim.log.levels.ERROR)
        return
      end

      -- Get current window and buffer info
      local current_win = vim.api.nvim_get_current_win()
      local current_buf = vim.api.nvim_get_current_buf()

      -- Create a new vertical split on the right
      vim.cmd("vsplit")

      -- Get the new window (should be the rightmost one)
      local windows = vim.api.nvim_list_wins()
      local new_win = nil
      for _, win in ipairs(windows) do
        if win ~= current_win then
          new_win = win
          break
        end
      end

      if new_win then
        -- Create a new terminal buffer and start cursor-agent
        local term_buf = vim.api.nvim_create_buf(false, true)
        
        -- Set the terminal buffer in the new window
        vim.api.nvim_win_set_buf(new_win, term_buf)
        
        -- Switch to the terminal buffer context and start cursor-agent
        vim.api.nvim_set_current_buf(term_buf)
        vim.fn.termopen("cursor-agent", {
          on_exit = function()
            -- Clean up when terminal exits
            vim.api.nvim_buf_delete(term_buf, { force = true })
          end
        })

        -- Set terminal to insert mode
        vim.cmd("startinsert")

        -- Set maximum width for the terminal to 70 columns
        local width = math.min(70, vim.o.columns - 10) -- Ensure we don't exceed screen width
        vim.api.nvim_win_set_width(new_win, width)

        -- Optional: Add some styling
        vim.api.nvim_win_set_option(new_win, "number", false)
        vim.api.nvim_win_set_option(new_win, "relativenumber", false)
        vim.api.nvim_win_set_option(new_win, "signcolumn", "no")

        vim.notify("Cursor Agent terminal opened", vim.log.levels.INFO)
      end
    end, {
      desc = "Open cursor-agent in terminal on the right",
    })
  end,
}
