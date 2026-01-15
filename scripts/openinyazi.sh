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

# Create a temporary script to avoid command parsing issues
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << EOF
#!/bin/zsh
source ~/.zshrc
cd '$TARGET_DIR'
y
exec zsh
EOF

chmod +x "$TEMP_SCRIPT"

# Open the terminal and run the temporary script
kitty -e "$TEMP_SCRIPT"

# Clean up the temporary script after a short delay
(sleep 2 && rm -f "$TEMP_SCRIPT") &
