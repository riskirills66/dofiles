return {
  "github/copilot.vim",
  event = "InsertEnter",
  config = function()
    vim.g.copilot_no_tab_map = true -- optional: disable default tab mapping
    vim.api.nvim_set_keymap("i", "<C-J>", 'copilot#Accept("<CR>")', {
      expr = true,
      silent = true,
      noremap = true,
    })
  end,
}
