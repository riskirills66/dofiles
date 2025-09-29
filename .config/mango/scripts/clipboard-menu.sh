#!/bin/bash
# Clipboard menu script for MangoWC

# Get clipboard history and show in rofi
SELECTION=$(cliphist list | rofi -dmenu -i -p "Clipboard History:")

# If user selected something, decode and copy it
if [ -n "$SELECTION" ]; then
    # Extract the ID from the selection (first column)
    ID=$(echo "$SELECTION" | awk '{print $1}')
    
    # Decode and copy to clipboard
    cliphist decode "$ID" | wl-copy
    
    # Show notification
    notify-send "Clipboard" "Item copied to clipboard"
fi
