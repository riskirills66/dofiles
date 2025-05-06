return {
  "akinsho/flutter-tools.nvim",
  ft = "dart",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "stevearc/dressing.nvim", -- optional: better UI
  },
  config = function()
    require("flutter-tools").setup({
      lsp = {
        on_attach = function(_, bufnr)
          -- keybinds or other config
        end,
      },
    })
  end,
}
