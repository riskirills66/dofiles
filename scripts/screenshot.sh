#!/bin/bash

# Define the options for the menu
options="Screenshot Fullscreen\nScreenshot Window\nScreenshot Region"

# Show the rofi menu and get the selected option
chosen=$(echo -e "$options" | rofi -dmenu -p "Screenshot")

# Check the user's selection and run the corresponding command
case "$chosen" in
    "Screenshot Fullscreen")
        hyprshot -m output
        ;;
    "Screenshot Window")
        hyprshot -m window
        ;;
    "Screenshot Region")
        hyprshot -m region 
	;;
    *)
        echo "No valid option selected"
        ;;
esac
