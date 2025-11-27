---@type LazySpec
return {
  "mikavilpas/yazi.nvim",
  event = "VeryLazy",
  dependencies = {
    -- Make sure to follow installation steps for this if needed:
    "folke/snacks.nvim",
  },
  keys = {
    {
      "<c-w>y",
      mode = { "n", "v" },
      "<cmd>Yazi<cr>",
      desc = "Open yazi at the current file",
    },
  },
  opts = {
    open_for_directories = false,
    keymaps = {
      show_help = "<f1>",
    },
  },
  init = function()
    -- optional: disable netrw to avoid conflicts
    -- vim.g.loaded_netrw = 1
    vim.g.loaded_netrwPlugin = 1
  end,
}
