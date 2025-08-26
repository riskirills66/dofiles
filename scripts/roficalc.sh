#!/bin/bash
# ~/scripts/roficalc.sh

result=$(rofi -dmenu -p "Calc:" | bc -l)
if [ -n "$result" ]; then
  notify-send "Result" "$result"

  # Copy to clipboard: Wayland fallback to X11
  if command -v wl-copy &>/dev/null; then
    echo -n "$result" | wl-copy
  elif command -v xclip &>/dev/null; then
    echo -n "$result" | xclip -selection clipboard
  else
    notify-send "Clipboard Error" "No clipboard utility found (wl-copy or xclip)"
  fi
fi
