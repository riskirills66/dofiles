#!/bin/bash

# Grim screenshot tool
export PATH="$HOME/.local/bin:$PATH"

# Ensure the output directory exists
output_dir="$HOME/Pictures/Screenshots"
mkdir -p "$output_dir"

# Define the options for the menu
options="Screenshot Fullscreen\nScreenshot Region"

# Show the rofi menu and get the selected option
chosen=$(echo -e "$options" | rofi -dmenu -p "Screenshot")

# Generate timestamp for filename
timestamp=$(date +"%Y%m%d_%H%M%S")

# Check the user's selection and run the corresponding command
case "$chosen" in
"Screenshot Fullscreen")
  # Use slurp to select which monitor to capture (click anywhere on the monitor)
  monitor=$(slurp -o)
  grim -g "$monitor" - | swappy -f -
  ;;
"Screenshot Region")
  # Use slurp to select region, then grim to capture it
  # Add a small delay to ensure transparency effects are rendered
  region=$(slurp)
  sleep 0.2
  # Try to capture without transparency effects by using a different approach
  grim -g "$region" - | swappy -f -
  ;;
*)
  echo "No valid option selected"
  ;;
esac