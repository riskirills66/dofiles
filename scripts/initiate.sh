#!/bin/bash

# Path to the directory
WAL_DIR="$HOME/.cache/wal"

# Path to the script to be run
RELOAD_SCRIPT="$HOME/reload.sh"

# Source and destination for the image
IMAGE_SOURCE="$HOME/.config/hypr/defaultwal/tokyo_night_ms_designer.jpeg"
DOWNLOADS_DIR="$HOME/Downloads"

# Check if there are no jpg, jpeg, or png files in Downloads
if ! ls "$DOWNLOADS_DIR"/*.{jpg,jpeg,png} >/dev/null 2>&1; then
  echo "No image files found in $DOWNLOADS_DIR. Copying $IMAGE_SOURCE..."
  # Copy the image to Downloads
  cp "$IMAGE_SOURCE" "$DOWNLOADS_DIR"
else
  echo "Image files already exist in $DOWNLOADS_DIR. No action taken."
fi

# Check if the directory does not exist
if [ ! -d "$WAL_DIR" ]; then
  echo "$WAL_DIR does not exist. Running $RELOAD_SCRIPT..."
  # Run the reload script
  bash "$RELOAD_SCRIPT"
else
  echo "$WAL_DIR exists. Nothing to do."
fi