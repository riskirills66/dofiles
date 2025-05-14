#!/bin/bash

# Check if the user has passed a file path as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 path/to/image"
  exit 1
fi

IMAGE_PATH="$1"

# Check if the file exists
if [ ! -f "$IMAGE_PATH" ]; then
  echo "File not found: $IMAGE_PATH"
  exit 1
fi

# Define the command to run: show image and wait for keypress
SHOW_IMAGE_CMD="kitty +kitten icat '$IMAGE_PATH'; echo -n 'Press return key to exit...'; read -n 1;"

if [ -n "$TMUX" ]; then
  # Inside tmux: open a new pane and run the image display + keypress
  tmux split-window -h "zsh -c \"$SHOW_IMAGE_CMD\""
  tmux select-layout tiled
else
  # Outside tmux: open a new kitty window and run the same logic
  kitty -- zsh -c "$SHOW_IMAGE_CMD"
fi
