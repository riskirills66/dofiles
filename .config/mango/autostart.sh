#!/bin/bash
# MangoWC Autostart Script - Based on Hyprland autostart

# Set environment variables
export XCURSOR_SIZE=24
export HYPRCURSOR_SIZE=24
export HYPRCURSOR_THEME=breeze-dark

# Start essential services
waybar &
hyprpaper &

# Clipboard management
wl-paste --type text --watch cliphist store &
wl-paste --type image --watch cliphist store &

# GPU recovery services (if they exist)
if [ -f ~/.config/hypr/auto-gpu-recovery.sh ]; then
  ~/.config/hypr/auto-gpu-recovery.sh &
fi

if [ -f ~/.config/hypr/startup-gpu-protection.sh ]; then
  ~/.config/hypr/startup-gpu-protection.sh &
fi

# Start notification daemon
if command -v dunst >/dev/null 2>&1; then
    dunst &
fi
