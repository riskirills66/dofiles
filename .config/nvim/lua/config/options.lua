vim.cmd([[
  augroup TransparentBackground
    autocmd!
    autocmd ColorScheme * highlight Normal ctermbg=none guibg=none
    autocmd ColorScheme * highlight NormalNC ctermbg=none guibg=none
    autocmd ColorScheme * highlight SignColumn ctermbg=none guibg=none
    autocmd ColorScheme * highlight VertSplit ctermbg=none guibg=none
    autocmd ColorScheme * highlight StatusLine ctermbg=none guibg=none
  augroup END
]])

vim.cmd([[
  augroup TransparentFloat
    autocmd!
    autocmd ColorScheme * highlight NormalFloat ctermbg=none guibg=none
    autocmd ColorScheme * highlight FloatBorder ctermbg=none guibg=none
    autocmd ColorScheme * highlight Pmenu ctermbg=none guibg=none
    autocmd ColorScheme * highlight PmenuSel ctermbg=none guibg=none
    autocmd ColorScheme * highlight TelescopeNormal ctermbg=none guibg=none
    autocmd ColorScheme * highlight TelescopeBorder ctermbg=none guibg=none
  augroup END
]])

-- Enable autoread to automatically reload files edited outside Neovim
vim.o.autoread = true

-- Real-time file watching and auto-reload
vim.cmd([[
  augroup AutoReload
    autocmd!
    " Check for file changes when focus returns to Neovim
    autocmd FocusGained,BufEnter,CursorHold,CursorHoldI * if mode() != 'c' | checktime | endif
    " Notification after file change
    autocmd FileChangedShellPost *
      \ echohl WarningMsg | echo "File changed on disk. Buffer reloaded." | echohl None
  augroup END
]])

-- Real-time file watching using timer
local file_watchers = {}

local function setup_file_watcher(bufnr)
  if file_watchers[bufnr] then
    return -- Already watching this buffer
  end
  
  local filename = vim.api.nvim_buf_get_name(bufnr)
  if filename == "" or vim.fn.isdirectory(filename) == 1 then
    return -- Skip empty buffers and directories
  end
  
  local timer = vim.loop.new_timer()
  local last_mtime = vim.fn.getftime(filename)
  
  timer:start(1000, 1000, function()
    local current_mtime = vim.fn.getftime(filename)
    if current_mtime ~= last_mtime and current_mtime > 0 then
      last_mtime = current_mtime
      vim.schedule(function()
        if vim.api.nvim_buf_is_valid(bufnr) and not vim.api.nvim_buf_get_option(bufnr, 'modified') then
          vim.api.nvim_buf_call(bufnr, function()
            vim.cmd('silent! edit!')
            vim.notify("File '" .. vim.fn.fnamemodify(filename, ':t') .. "' was modified externally and reloaded", vim.log.levels.INFO)
          end)
        end
      end)
    end
  end)
  
  file_watchers[bufnr] = timer
  
  -- Clean up when buffer is deleted
  vim.api.nvim_create_autocmd('BufDelete', {
    buffer = bufnr,
    callback = function()
      if file_watchers[bufnr] then
        file_watchers[bufnr]:stop()
        file_watchers[bufnr]:close()
        file_watchers[bufnr] = nil
      end
    end,
  })
end

-- Start watching when a buffer is loaded
vim.api.nvim_create_autocmd('BufReadPost', {
  callback = function(args)
    setup_file_watcher(args.buf)
  end
})

-- Start watching for new buffers
vim.api.nvim_create_autocmd('BufNewFile', {
  callback = function(args)
    setup_file_watcher(args.buf)
  end
})
