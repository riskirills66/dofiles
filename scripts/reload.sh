#!/bin/bash

# Kill running processes
killall waybar
killall hyprpaper
killall swaybg
killall dunst
killall quickshell

# Wait a moment for processes to terminate
sleep 1

# Relaunch applications
waybar &
hyprpaper &
dunst &
quickshell &

# Find and use the nostalgia image
if [ -f ~/nostalgia.jpg ]; then
  swaybg -i ~/nostalgia.jpg -m fill &
elif [ -f ~/nostalgia.png ]; then
  swaybg -i ~/nostalgia.png -m fill &
elif [ -f ~/nostalgia.jpeg ]; then
  swaybg -i ~/nostalgia.jpeg -m fill &
else
  echo "Warning: No nostalgia image found (jpg, png, or jpeg)"
fi

echo "Waybar, Hyprpaper, and Swaybg have been restarted"
