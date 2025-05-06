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
