#!/bin/zsh

# Check if a directory argument is provided
TARGET_DIR="${1:-$(pwd)}"

# Decode URL-encoded paths (for example, 'Telegram%20Desktop' becomes 'Telegram Desktop')
TARGET_DIR=$(echo "$TARGET_DIR" | sed 's/%20/ /g')

# Check if it's a file URL (starts with file://)
if [[ "$TARGET_DIR" =~ ^file:// ]]; then
    # Strip the file:// prefix to get the local directory
    TARGET_DIR="${TARGET_DIR:7}"
fi

# Open the terminal and run Yazi in the specified directory using zsh
kitty -- zsh -c "cd '$TARGET_DIR' && yazi; exec zsh"
