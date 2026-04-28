#!/bin/bash

# Grim screenshot tool
export PATH="$HOME/.local/bin:$PATH"

# Ensure the output directory exists
output_dir="$HOME/Pictures/Screenshots"
mkdir -p "$output_dir"

# Generate timestamp for filename
timestamp=$(date +"%Y%m%d_%H%M%S")
filename="screenshot_${timestamp}.png"
filepath="$output_dir/$filename"

# Get window geometries from hyprctl for single-click window selection
if command -v jq >/dev/null 2>&1; then
  monitors=$(hyprctl -j monitors)
  clients=$(hyprctl -j clients | jq -r '[.[] | select(.workspace.id | contains('$(echo "$monitors" | jq -r 'map(.activeWorkspace.id) | join(",")')'))]')
  boxes=$(echo "$clients" | jq -r '.[] | "\(.at[0]),\(.at[1]) \(.size[0])x\(.size[1]) \(.title)"' | cut -f1,2 -d' ')
fi

# Use slurp with window choices if available
if [ -n "$boxes" ]; then
  selection=$(slurp <<< "$boxes")
else
  selection=$(slurp)
fi

if [ $? -ne 0 ] || [ -z "$selection" ]; then
  exit 0
fi

sleep 0.1

# Check if selection is just a point (click without drag on empty space)
# slurp outputs "x,y wxh" format
w=$(echo "$selection" | grep -oP '\d+x\K\d+' | tail -1)
h=$(echo "$selection" | grep -oP 'x\K\d+$')

if [ -n "$w" ] && [ -n "$h" ] && [ "$w" -le 2 ] && [ "$h" -le 2 ]; then
  # Clicked on empty space, use active window instead
  active_window=$(hyprctl activewindow | awk '/at:/{at=$2} /size:/{gsub(/,/,"x",$2); size=$2} END{print at" "size}')
  if [ -n "$active_window" ]; then
    selection="$active_window"
  fi
fi

grim -g "$selection" "$filepath"
if [ $? -ne 0 ]; then
  # grim failed, show error notification
  notify-send "Screenshot failed" "Failed to capture screenshot"
  exit 1
fi

# Copy to clipboard
wl-copy <"$filepath"

# Show notification with preview
notify-send -i "$filepath" "Screenshot saved" "Saved to $filename and copied to clipboard"

# Open swappy for editing
swappy -f "$filepath"
