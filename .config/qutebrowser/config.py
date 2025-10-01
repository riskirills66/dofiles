# pylint: disable=C0111
c = c  # noqa: F821 pylint: disable=E0602,C0103
config = config  # noqa: F821 pylint: disable=E0602,C0103
# pylint settings included to disable linting errors

# Color scheme - using hardcoded colors instead of X resources
colors = {
    "foreground": "#ffffff",
    "background": "#000000",
    "color0": "#000000",
    "color1": "#ff5555",
    "color2": "#50fa7b",
    "color3": "#f1fa8c",
    "color4": "#bd93f9",
    "color5": "#ff79c6",
    "color6": "#8be9fd",
    "color7": "#bfbfbf",
    "color8": "#4d4d4d",
    "color9": "#ff6e6e",
    "color10": "#69ff94",
    "color11": "#ffffa5",
    "color12": "#d6acff",
    "color13": "#ff92df",
    "color14": "#a4ffff",
    "color15": "#ffffff",
}

c.colors.statusbar.normal.bg = colors["background"]
c.colors.statusbar.command.bg = colors["background"]
c.colors.statusbar.command.fg = colors["foreground"]
c.colors.statusbar.normal.fg = colors["color14"]
c.colors.statusbar.passthrough.fg = colors["color14"]
c.colors.statusbar.url.fg = colors["color13"]
c.colors.statusbar.url.success.https.fg = colors["color13"]
c.colors.statusbar.url.hover.fg = colors["color12"]
c.statusbar.show = "in-mode"
c.colors.tabs.even.bg = colors["color8"]  # dark gray for unselected tabs
c.colors.tabs.odd.bg = colors["color8"]  # dark gray for unselected tabs
c.colors.tabs.bar.bg = colors["background"]  # black tab bar background
# c.colors.tabs.even.bg = xresources["*.background"]
# c.colors.tabs.odd.bg = xresources["*.background"]
c.colors.tabs.even.fg = colors["foreground"]  # white text for unselected tabs
c.colors.tabs.odd.fg = colors["foreground"]  # white text for unselected tabs
c.colors.tabs.selected.even.bg = colors["color7"]  # lighter gray for selected tabs
c.colors.tabs.selected.odd.bg = colors["color7"]  # lighter gray for selected tabs
c.colors.tabs.selected.even.fg = colors["background"]  # black text for selected tabs
c.colors.tabs.selected.odd.fg = colors["background"]  # black text for selected tabs
c.colors.hints.bg = colors["background"]
c.colors.hints.fg = colors["foreground"]
c.tabs.show = "multiple"

c.colors.completion.item.selected.match.fg = colors["color6"]
c.colors.completion.match.fg = colors["color6"]

c.colors.tabs.indicator.start = colors["color10"]
c.colors.tabs.indicator.stop = colors["color8"]
c.colors.completion.odd.bg = colors["background"]
c.colors.completion.even.bg = colors["background"]
c.colors.completion.fg = colors["foreground"]
c.colors.completion.category.bg = colors["background"]
c.colors.completion.category.fg = colors["foreground"]
c.colors.completion.item.selected.bg = colors["background"]
c.colors.completion.item.selected.fg = colors["foreground"]

c.colors.messages.info.bg = colors["background"]
c.colors.messages.info.fg = colors["foreground"]
c.colors.messages.error.bg = colors["background"]
c.colors.messages.error.fg = colors["foreground"]
c.colors.downloads.error.bg = colors["background"]
c.colors.downloads.error.fg = colors["foreground"]

c.colors.downloads.bar.bg = colors["background"]
c.colors.downloads.start.bg = colors["color10"]
c.colors.downloads.start.fg = colors["foreground"]
c.colors.downloads.stop.bg = colors["color8"]
c.colors.downloads.stop.fg = colors["foreground"]

c.colors.tooltip.bg = colors["background"]
c.colors.webpage.bg = colors["background"]
c.hints.border = colors["foreground"]

c.url.start_pages = "https://www.google.com"
c.url.default_page = "https://www.google.com"

c.tabs.title.format = "{audio}{current_title}"
c.fonts.web.size.default = 20

c.url.searchengines = {
    "DEFAULT": "https://www.google.com/search?q={}",
    "!ddg": "https://duckduckgo.com/?q={}",
    "!aw": "https://wiki.archlinux.org/?search={}",
    "!apkg": "https://archlinux.org/packages/?sort=&q={}&maintainer=&flagged=",
    "!gh": "https://github.com/search?o=desc&q={}&s=stars",
    "!yt": "https://www.youtube.com/results?search_query={}",
    "!aur": "https://aur.archlinux.org/packages?K={}",
    "!shopee": "https://shopee.co.id/search?keyword={}",
    "!ps": "https://play.google.com/store/search?q={}",
    "!svg": "https://www.svgrepo.com/vectors/{}",
    "!wiki": "https://wikipedia.org/wiki/{}",
}

c.completion.open_categories = [
    "searchengines",
    "quickmarks",
    "bookmarks",
    "history",
    "filesystem",
]

config.load_autoconfig()  # load settings done via the gui

c.auto_save.session = True  # save tabs on quit/restart

# keybinding changes - using defaults for now

# dark mode setup
c.colors.webpage.darkmode.enabled = True
c.colors.webpage.darkmode.algorithm = "lightness-cielab"
c.colors.webpage.darkmode.policy.images = "never"
config.set("colors.webpage.darkmode.enabled", False, "file://*")

# styles, cosmetics
# c.content.user_stylesheets = ["~/.config/qutebrowser/styles/youtube-tweaks.css"]
c.tabs.padding = {"top": 2, "bottom": 2, "left": 6, "right": 6}
c.tabs.indicator.width = 0  # no tab indicators
# c.window.transparent = True # apparently not needed
c.tabs.width = "7%"

# scrolling settings
c.scrolling.smooth = True
c.scrolling.bar = "when-searching"

# Custom smooth scrolling bindings
config.bind(
    "j",
    "scroll down ;; scroll down ;; scroll down ;; scroll down ;; scroll down ;; scroll down",
)  # Smooth scroll down 9x
config.bind(
    "k", "scroll up ;; scroll up ;; scroll up ;; scroll up ;; scroll up ;; scroll up"
)  # Smooth scroll up 9x
config.bind(
    "<Ctrl+d>",
    "scroll down ;; scroll down ;; scroll down ;; scroll down ;; scroll down ;; scroll down",
)  # Smooth scroll down 9x
config.bind(
    "<Ctrl+u>",
    "scroll up ;; scroll up ;; scroll up ;; scroll up ;; scroll up ;; scroll up",
)  # Smooth scroll up 9x

# Reduce tab and status bar height
c.statusbar.padding = {"top": 2, "bottom": 2, "left": 4, "right": 4}

# fonts - smaller interface font for more compact UI
c.fonts.default_family = []
c.fonts.default_size = "10pt"
c.fonts.statusbar = "10pt"
c.fonts.web.family.fixed = "monospace"
c.fonts.web.family.sans_serif = "monospace"
c.fonts.web.family.serif = "monospace"
c.fonts.web.family.standard = "monospace"

# privacy - adjust these settings based on your preference
# config.set("completion.cmd_history_max_items", 0)
# config.set("content.private_browsing", True)
config.set("content.webgl", False, "*")
config.set("content.canvas_reading", False)
config.set("content.geolocation", False)
config.set("content.webrtc_ip_handling_policy", "default-public-interface-only")
config.set("content.cookies.accept", "all")
config.set("content.cookies.store", True)
config.set(
    "content.javascript.enabled", True
)  # Enable JavaScript for Greasemonkey scripts

# Adblocking info -->
# For yt ads: place the greasemonkey script yt-ads.js in your greasemonkey folder (~/.config/qutebrowser/greasemonkey).
# The script skips through the entire ad, so all you have to do is click the skip button.
# Yeah it's not ublock origin, but if you want a minimal browser, this is a solution for the tradeoff.
# You can also watch yt vids directly in mpv, see qutebrowser FAQ for how to do that.
# If you want additional blocklists, you can get the python-adblock package, or you can uncomment the ublock lists here.
c.content.blocking.enabled = True

# Greasemonkey scripts are automatically enabled when placed in ~/.config/qutebrowser/greasemonkey/
c.content.user_stylesheets = []
# c.content.blocking.method = 'adblock' # uncomment this if you install python-adblock
# c.content.blocking.adblock.lists = [
#         "https://github.com/ewpratten/youtube_ad_blocklist/blob/master/blocklist.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/legacy.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters-2020.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters-2021.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters-2022.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters-2023.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/filters-2024.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/badware.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/privacy.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/badlists.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/annoyances.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/annoyances-cookies.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/annoyances-others.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/badlists.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/quick-fixes.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/resource-abuse.txt",
#         "https://github.com/uBlockOrigin/uAssets/raw/master/filters/unbreak.txt"]
