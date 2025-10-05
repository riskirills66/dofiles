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

# Use slurp to select which monitor to capture (click anywhere on the monitor)
monitor=$(slurp -o)
grim -g "$monitor" "$filepath"

# Copy to clipboard
wl-copy < "$filepath"

# Show notification with preview
notify-send -i "$filepath" "Screenshot saved" "Saved to $filename and copied to clipboard"

# Open swappy for editing
swappy -f "$filepath"