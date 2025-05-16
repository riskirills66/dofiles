#!/bin/bash

# Hyprshot
export PATH="$HOME/.local/bin:$PATH"

# Ensure the output directory exists
output_dir="$HOME/Pictures/Screenshots"
mkdir -p "$output_dir"

# Define the options for the menu
options="Screenshot Fullscreen\nScreenshot Window\nScreenshot Region"

# Show the rofi menu and get the selected option
chosen=$(echo -e "$options" | rofi -dmenu -p "Screenshot")

# Check the user's selection and run the corresponding command
case "$chosen" in
"Screenshot Fullscreen")
  hyprshot -m output -o "$output_dir"
  ;;
"Screenshot Window")
  hyprshot -m window -o "$output_dir"
  ;;
"Screenshot Region")
  hyprshot -m region -o "$output_dir"
  ;;
*)
  echo "No valid option selected"
  ;;
esac
