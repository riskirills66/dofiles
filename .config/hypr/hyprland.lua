-- Hyprland config for 0.56 (Lua syntax, replaces hyprlang hyprland.conf)
-- Docs: https://wiki.hypr.land/Configuring/Start/

-- Monitors
require("monitors")

-- parameters
local terminal = "kitty"
local filemanager = "kitty -e /home/riskirills/scripts/filemanager.sh"
local menu = "rofi -show drun"

-- Env Variables
hl.env("XCURSOR_SIZE", "24")
hl.env("XCURSOR_THEME", "BreezeX-RosePine-Linux")
hl.env("HYPRCURSOR_SIZE", "24")
hl.env("HYPRCURSOR_THEME", "BreezeX-RoséPine")

-- Appearance
hl.config({
	general = {
		gaps_in = 4,
		gaps_out = 8,

		border_size = 1,

		col = {
			-- https://wiki.hypr.land/Configuring/Basics/Variables/ for info about colors
			active_border = "rgba(EBBCBAFF)",
			inactive_border = "rgba(6E6A86FF)",
			-- col.active_border = rgba(6E6A86FF)
		},

		-- Set to true enable resizing windows by clicking and dragging on borders and gaps
		resize_on_border = true,

		-- Please see https://wiki.hypr.land/Configuring/Advanced-and-Cool/Tearing/ before you turn this on
		allow_tearing = false,

		layout = "dwindle",
	},

	decoration = {
		rounding = 15,

		-- Change transparency of focused and unfocused windows
		active_opacity = 1.0,
		inactive_opacity = 1.0,

		shadow = {
			enabled = true,
			range = 4,
			render_power = 3,
			color = "rgba(1a1a1aee)",
		},

		-- https://wiki.hypr.land/Configuring/Basics/Variables/#blur
		blur = {
			enabled = true,
			size = 3,
			passes = 4,
			new_optimizations = true,
			ignore_opacity = true,
			xray = true,
			vibrancy = 1.0,
		},
	},
})

-- https://wiki.hypr.land/Configuring/Advanced-and-Cool/Animations/
-- Curves/animations from the old config were removed: animations are disabled.
hl.config({
	animations = {
		enabled = false,
	},
})

hl.config({
	dwindle = {
		-- pseudotile option was removed in this Hyprland version
		preserve_split = true, -- You probably want this
	},
})

-- See https://wiki.hypr.land/Configuring/Layouts/Master-Layout/ for more
hl.config({
	master = {
		new_status = "master",
	},
})

-- https://wiki.hypr.land/Configuring/Basics/Variables/#misc
hl.config({
	misc = {
		force_default_wallpaper = -1, -- Set to 0 or 1 to disable the anime mascot wallpapers
		disable_hyprland_logo = false, -- If true disables the random hyprland logo / anime girl background. :(

		-- GPU Stability Settings
		-- Reduce GPU load and prevent flickering
		disable_autoreload = false,
	},
})

-- input
hl.config({
	input = {
		kb_layout = "us",
		kb_variant = "",
		kb_model = "",
		kb_options = "",
		kb_rules = "",

		follow_mouse = 1,

		sensitivity = 0, -- -1.0 - 1.0, 0 means no modification.

		touchpad = {
			natural_scroll = false,
		},
	},
})

-- https://wiki.hypr.land/Configuring/Basics/Variables/#cursor
hl.config({
	cursor = {
		-- Use CPU/dumb-buffer path for HW cursors to avoid GL context reset crash
		-- (crash in beginSimple / glGetGraphicsResetStatus, see crash report 19164)
		use_cpu_buffer = 1,
	},
})

-- Example per-device config
-- See https://wiki.hypr.land/Configuring/Advanced-and-Cool/Devices/ for more
hl.device({
	name = "epic-mouse-v1",
	sensitivity = -0.5,
})

-- autolaunch (exec-once, fires only once on first frame)
-- hl.on("hyprland.start", ...) does not re-run on `hyprctl reload`
hl.on("hyprland.start", function()
	hl.exec_cmd("quickshell")
	hl.exec_cmd("wl-paste --type text --watch cliphist store") -- Stores only text data
	hl.exec_cmd("wl-paste --type image --watch cliphist store") -- Stores only image data
	hl.exec_cmd("'/usr/bin/nextcloud' --background")
	hl.exec_cmd("/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1")
	hl.exec_cmd("swaybg -i ~/nostalgia.jpg -m fill")

	-- Auto-start GPU recovery service for continuous protection
	-- (script missing: ~/.config/hypr/auto-gpu-recovery.sh)
	-- hl.exec_cmd("~/.config/hypr/auto-gpu-recovery.sh")

	-- Ensure GPU protection services start properly
	-- (script missing: ~/.config/hypr/startup-gpu-protection.sh)
	-- hl.exec_cmd("~/.config/hypr/startup-gpu-protection.sh")
end)

-- Keybindings
local mainMod = "ALT" -- Sets "Windows" key as main modifier

-- mouseresize
hl.bind("SUPER + mouse:272", hl.dsp.window.drag(), { mouse = true })
hl.bind("SUPER + mouse:273", hl.dsp.window.resize(), { mouse = true })

hl.bind("SUPER + return", hl.dsp.exec_cmd("kitty --hold fastfetch -l Fedora_small"))
hl.bind("SUPER + SHIFT + return", hl.dsp.exec_cmd(terminal))
hl.bind("SUPER + Q", hl.dsp.window.kill())
hl.bind("SUPER + M", hl.dsp.exit())
hl.bind("SUPER + E", hl.dsp.exec_cmd(filemanager))
hl.bind(mainMod .. " + T", hl.dsp.window.float({ action = "toggle" }))
hl.bind("SUPER + CTRL + return", hl.dsp.exec_cmd(menu))
hl.bind("SUPER + P", hl.dsp.window.pseudo())
hl.bind(mainMod .. " + SHIFT + g", hl.dsp.layout("togglesplit"))
hl.bind(mainMod .. " + f", hl.dsp.window.fullscreen({ action = "toggle" }))
hl.bind(mainMod .. " + h", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + l", hl.dsp.focus({ direction = "right" }))
hl.bind(mainMod .. " + k", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + j", hl.dsp.focus({ direction = "down" }))
hl.bind("CTRL + ALT + DELETE", hl.dsp.exec_cmd("wlogout"))

-- refresh bind
hl.bind("CTRL + SHIFT + ALT + return", hl.dsp.exec_cmd("~/scripts/reload.sh"))

-- hyprshot
hl.bind("SUPER + SHIFT + S", hl.dsp.exec_cmd("~/scripts/screenshot.sh"))
hl.bind("PRINT", hl.dsp.exec_cmd("~/scripts/screenshot.sh"))

-- ocr
hl.bind("SUPER + SHIFT + T", hl.dsp.exec_cmd("~/scripts/ocr.sh"))

-- utility bind
hl.bind("SUPER + SHIFT + l", hl.dsp.exec_cmd("hyprlock"))
hl.bind("SUPER + PERIOD", hl.dsp.exec_cmd("rofi -show emoji"))
hl.bind("SUPER + V", hl.dsp.exec_cmd("cliphist list | rofi -dmenu | cliphist decode | wl-copy"))
hl.bind("SUPER + SHIFT + C", hl.dsp.exec_cmd("hyprpicker -a"))

-- Move Focused Window
hl.bind(mainMod .. " + SHIFT + l", hl.dsp.window.move({ direction = "right" }))
hl.bind(mainMod .. " + SHIFT + h", hl.dsp.window.move({ direction = "left" }))
hl.bind(mainMod .. " + SHIFT + j", hl.dsp.window.move({ direction = "down" }))
hl.bind(mainMod .. " + SHIFT + k", hl.dsp.window.move({ direction = "up" }))

-- Move Focused Workspaces
hl.bind(mainMod .. " + SHIFT + a", hl.dsp.workspace.move({ monitor = "l" }))
hl.bind(mainMod .. " + SHIFT + f", hl.dsp.workspace.move({ monitor = "r" }))

-- Toggle a workspace between the focused monitor and the "other" monitor.
-- Replaces ~/.config/hypr/scripts/toggle_ws.sh
local function toggle_ws(id)
	local orig = hl.get_active_monitor()
	if not orig then
		return
	end

	-- "Other" monitor: first one that isn't the focused one
	local other
	for _, m in ipairs(hl.get_monitors()) do
		if m.name ~= orig.name then
			other = m
			break
		end
	end

	-- Monitor currently holding this workspace (if it exists)
	local ws_mon
	for _, ws in ipairs(hl.get_workspaces()) do
		if ws.id == id then
			ws_mon = ws.monitor
			break
		end
	end

	if not ws_mon then
		-- Doesn't exist yet -> spawn/move it to the focused monitor and focus it
		hl.dispatch(hl.dsp.workspace.move({ workspace = id, monitor = orig.name }))
		hl.dispatch(hl.dsp.focus({ workspace = id }))
		return
	end

	if ws_mon.name ~= orig.name then
		-- On another monitor -> bring it here and focus it
		hl.dispatch(hl.dsp.workspace.move({ workspace = id, monitor = orig.name }))
		hl.dispatch(hl.dsp.focus({ workspace = id }))
		return
	end

	local active = hl.get_active_workspace(orig)
	if not active or active.id ~= id then
		-- Here but not active -> just focus it
		hl.dispatch(hl.dsp.focus({ workspace = id }))
		return
	end

	-- Here AND active -> send it to the other monitor, keep focus here
	if other then
		hl.dispatch(hl.dsp.workspace.move({ workspace = id, monitor = other.name }))
		hl.dispatch(hl.dsp.focus({ monitor = orig.name }))
	end
end

for i = 1, 10 do
	local key = i % 10 -- 10 maps to key 0
	hl.bind(mainMod .. " + " .. key, function()
		toggle_ws(i)
	end)
end

-- Move active window to a workspace with mainMod + SHIFT + [0-9]
for i = 1, 10 do
	local key = i % 10 -- 10 maps to key 0
	hl.bind(mainMod .. " + SHIFT + " .. key, hl.dsp.window.move({ workspace = i }))
end

-- Resize focused window by width and height using pixel increments
hl.bind("ALT + U", hl.dsp.window.resize({ x = 20, y = 0, relative = true }))
hl.bind("ALT + P", hl.dsp.window.resize({ x = -20, y = 0, relative = true }))
hl.bind("ALT + O", hl.dsp.window.resize({ x = 0, y = -20, relative = true }))
hl.bind("ALT + I", hl.dsp.window.resize({ x = 0, y = 20, relative = true }))

-- Laptop multimedia keys for volume and LCD brightness
hl.bind(
	"XF86AudioRaiseVolume",
	hl.dsp.exec_cmd("wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+"),
	{ locked = true, repeating = true }
)
hl.bind(
	"XF86AudioLowerVolume",
	hl.dsp.exec_cmd("wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-"),
	{ locked = true, repeating = true }
)
hl.bind(
	"XF86AudioMute",
	hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"),
	{ locked = true, repeating = true }
)
hl.bind(
	"XF86AudioMicMute",
	hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle"),
	{ locked = true, repeating = true }
)
hl.bind("XF86MonBrightnessUp", hl.dsp.exec_cmd("brightnessctl s 10%+"), { locked = true, repeating = true })
hl.bind("XF86MonBrightnessDown", hl.dsp.exec_cmd("brightnessctl s 10%-"), { locked = true, repeating = true })

-- Requires playerctl
hl.bind("XF86AudioNext", hl.dsp.exec_cmd("playerctl next"), { locked = true })
hl.bind("XF86AudioPause", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
hl.bind("XF86AudioPlay", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
hl.bind("XF86AudioPrev", hl.dsp.exec_cmd("playerctl previous"), { locked = true })

-- Old hyprlang `windowrule` entries are now `hl.window_rule({...})`.
-- The rules below were disabled in the old config; uncomment to enable.

-- hl.window_rule({ name = "telegram-ws",   match = { class = "org.telegram.desktop" }, workspace = 4 })
-- hl.window_rule({ name = "zapzap-ws",     match = { class = "ZapZap" },               workspace = 4 })
-- hl.window_rule({ name = "obsidian-ws",   match = { class = "obsidian" },             workspace = 4 })
-- hl.window_rule({ name = "otomax-ws",     match = { class = "otomax\\.exe", title = ".*OtomaX.*" }, workspace = 3 })
-- hl.window_rule({ name = "firefox-ws",    match = { class = "firefox" },              workspace = 1 })
-- hl.window_rule({ name = "librewolf-ws",  match = { class = "librewolf" },            workspace = 1 })
-- hl.window_rule({ name = "tmux-ws",       match = { title = "^Tmux$" },               workspace = 2 })
-- hl.window_rule({ name = "spotify-ws",    match = { class = "Spotify" },              workspace = 9 })

-- hl.window_rule({ name = "otomax-tile",    match = { class = "otomax\\.exe", title = ".*OtomaX.*" }, tile = true })
-- hl.window_rule({ name = "otomax-noinit",  match = { class = "otomax.exe" }, no_initial_focus = true })

-- hl.window_rule({ name = "galculator-float", match = { class = "galculator" }, float = true, animation = "slide", move = "80% 100", size = "300 400" })
-- hl.window_rule({ name = "smile-float",      match = { class = "it\\.mjorus\\.smile" }, float = true, animation = "slide", move = "cursor -50% -50%" })
-- hl.window_rule({ name = "sddm-wall-float",  match = { class = "kitty", title = "^(SDDM Wallpaper Change)$" }, float = true, animation = "slide", move = "50% 100", size = "600 280" })
-- hl.window_rule({ name = "fastfetch-float",  match = { class = "kitty", title = "^(Fastfetch)$" }, float = true, animation = "slide", move = "5% 100", size = "600 280" })
-- hl.window_rule({ name = "portal-float",     match = { class = "xdg-desktop-portal-gtk" }, float = true, animation = "slide" })

-- hl.window_rule({ name = "opacity-kitty",    match = { class = "kitty" },            opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-firefox",  match = { class = "org.mozilla.firefox" }, opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-librewolf", match = { class = "org.mozilla.librewolf" }, opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-vnc",      match = { class = "realvnc-vncviewer" }, opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-firefox2", match = { class = "firefox" },          opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-zen",      match = { class = "zen" },              opacity = "1.0 override 1.0 override" })
-- hl.window_rule({ name = "opacity-otomax",   match = { class = "otomax.exe" },       opacity = "0.8 override 0.8 override" })

-- Ignore maximize requests from apps. You'll probably like this.
-- hl.window_rule({ name = "suppress-maximize", match = { class = ".*" }, suppress_event = "maximize" })

-- Fix some dragging issues with XWayland
-- hl.window_rule({ name = "fix-xwayland-drags", match = { class = "^$", title = "^$", xwayland = true, float = true, fullscreen = false, pin = false }, no_focus = true })

hl.config({
	debug = {
		disable_logs = true,
	},
})
