#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"

# Directories
WALLPAPER_DIR="$HOME/Downloads/"
THUMBNAIL_DIR="/tmp/rofi_wallpaper_thumbnails"
mkdir -p "$THUMBNAIL_DIR"

# Function to generate thumbnails for wallpaper selection
generate_thumbnails() {
  # Generate thumbnails
  for img in "$WALLPAPER_DIR"/*.{jpg,jpeg,png}; do
    thumbnail="$THUMBNAIL_DIR/$(basename "$img")"
    if [ ! -f "$thumbnail" ]; then
      convert "$img" -resize 300x300 "$thumbnail" 2>/dev/null
    fi
  done

  # Combine thumbnails and names
  OPTIONS=""
  for img in "$WALLPAPER_DIR"/*.{jpg,jpeg,png}; do
    thumbnail="$THUMBNAIL_DIR/$(basename "$img")"
    OPTIONS+="$(basename "$img")\0icon\x1f$thumbnail\n"
  done

  # Use Rofi to select wallpaper
  SELECTED=$(echo -e "$OPTIONS" | rofi -dmenu -p "Select Wallpaper")

  # Check wallpaper selection
  if [ -z "$SELECTED" ]; then
    echo "No wallpaper selected. Exiting..."
    exit 1
  fi

  # Full path to the selected wallpaper
  SELECTED_WALLPAPER_PATH="$WALLPAPER_DIR/$SELECTED"

  # Ensure the selected wallpaper exists
  if [ ! -f "$SELECTED_WALLPAPER_PATH" ]; then
    echo "Wallpaper not found: $SELECTED_WALLPAPER_PATH"
    exit 1
  fi

  # Path to replace nostalgia.jpg
  TARGET_WALLPAPER="$HOME/nostalgia.jpg"

  # Convert to JPG if needed
  FILE_EXTENSION="${SELECTED_WALLPAPER_PATH##*.}"
  if [[ "$FILE_EXTENSION" != "jpg" ]]; then
    echo "Converting $SELECTED to JPG format..."
    magick "$SELECTED_WALLPAPER_PATH" "$TARGET_WALLPAPER"
  else
    cp "$SELECTED_WALLPAPER_PATH" "$TARGET_WALLPAPER"
  fi

  echo "Replaced nostalgia.jpg with $SELECTED"

  rm -rf ~/.cache/wal

  # Apply wallpaper and color scheme
  feh --bg-fill "$TARGET_WALLPAPER" --no-fehbg
  wal -i $HOME/nostalgia.jpg -o ~/.cache/wal/colors-kitty.conf
  wal -i $HOME/nostalgia.jpg -o ~/.cache/wal/colors-waybar.css
  sed -i "s|\(/home/\)[^/]*/\.cache/wal/colors-waybar\.css|\1$(whoami)/.cache/wal/colors-waybar.css|" ~/.config/waybar/style.css

  #  sed -i "s|/home/.*|/home/$(whoami)/.cache/wal/colors-waybar.css);|" ~/.config/waybar/style.css
  sed -i "s|/home/.*/.cache/wal/colors-waybar.css|/home/$(whoami)/.cache/wal/colors-waybar.css|" ~/.config/wlogout/style.css
  sed -i "s|/home/.*/nostalgia.jpg|/home/$(whoami)/nostalgia.jpg|" ~/.config/wlogout/style.css

  # Detect Wayland compositor and set wallpaper accordingly
  if command -v hyprctl &> /dev/null; then
    # Hyprland detected - use hyprpaper
    mkdir -p ~/.config/hypr # Create the directory if it doesn't exist

    # Get the list of connected monitors using wlr-randr
    connected_monitors=$(wlr-randr | grep -E "^[A-Za-z0-9-]+" | awk '{print $1}')

    # Clear the hyprpaper.conf file and set preload
    echo "preload = $HOME/nostalgia.jpg" >~/.config/hypr/hyprpaper.conf

    # Loop through each connected monitor and set the wallpaper for it
    for monitor in $connected_monitors; do
      echo "wallpaper = $monitor, $HOME/nostalgia.jpg" >>~/.config/hypr/hyprpaper.conf
    done

    # Disable splash screen
    echo "splash = false" >>~/.config/hypr/hyprpaper.conf

    # Kill existing instances of hyprpaper and waybar
    killall hyprpaper
    killall waybar

    # Restart hyprpaper and waybar
    hyprpaper &
    waybar &
  else
    # Other Wayland compositors - use swaybg or similar
    if command -v swaybg &> /dev/null; then
      killall swaybg 2>/dev/null
      swaybg -i "$HOME/nostalgia.jpg" -m fill &
    elif command -v wbg &> /dev/null; then
      killall wbg 2>/dev/null
      wbg "$HOME/nostalgia.jpg" &
    else
      # Fallback to feh if available
      feh --bg-fill "$HOME/nostalgia.jpg" --no-fehbg
    fi
    
    # Restart waybar if available
    if command -v waybar &> /dev/null; then
      killall waybar 2>/dev/null
      waybar &
    fi
  fi

  # Source pywal colors
  source ~/.cache/wal/colors.sh

  # Only replace color variables in the Rofi config file
  sed -i "s/b-color: .*/b-color: $background;/" ~/.config/rofi/config.rasi
  sed -i "s/fg-color: .*/fg-color: $color14;/" ~/.config/rofi/config.rasi
  sed -i "s/hl-color: .*/hl-color: $color14;/" ~/.config/rofi/config.rasi
  sed -i "s/fgp-color: .*/fgp-color: $color8;/" ~/.config/rofi/config.rasi
  sed -i "s/w-border-color: .*/w-border-color: $color14;/" ~/.config/rofi/config.rasi
  sed -i "s/wbg-color: .*/wbg-color: $background;/" ~/.config/rofi/config.rasi
  sed -i "s/alt-color: .*/alt-color: $background;/" ~/.config/rofi/config.rasi

  echo "Rofi colors updated."

  # Path to BetterDiscord theme CSS
  THEME_FILE="$HOME/.config/BetterDiscord/themes/midnight.theme.css"

  # Apply pywal colors to the midnight.theme.css file
  sed -i "s/--accent-1: .*/--accent-1: $color1;/" "$THEME_FILE"
  sed -i "s/--accent-2: .*/--accent-2: $color2;/" "$THEME_FILE"
  sed -i "s/--accent-3: .*/--accent-3: $color3;/" "$THEME_FILE"
  sed -i "s/--accent-4: .*/--accent-4: $color4;/" "$THEME_FILE"
  sed -i "s/--accent-5: .*/--accent-5: $color5;/" "$THEME_FILE"
  sed -i "s/--text-2: .*/--text-2: $color6;/" "$THEME_FILE"
  sed -i "s/--text-3: .*/--text-3: $color10;/" "$THEME_FILE"
  sed -i "s/--bg-4: .*/--bg-4: $color0;/" "$THEME_FILE"
  sed -i "s/--bg-3: .*/--bg-3: $color0;/" "$THEME_FILE"
  sed -i "s/--text-4: .*/--text-4: $color3;/" "$THEME_FILE"
  sed -i "s/--text-5: .*/--text-5: $foreground;/" "$THEME_FILE"

  echo "BetterDiscord theme updated with pywal colors."

  #Apply pywal colors to hyprland border window
  sed -i "s/col.active_border = .*/col.active_border = rgba($color14)/" ~/.config/hypr/hyprland.conf
  sed -i "s/col.active_border = rgba(#\([0-9A-Fa-f]\{6\}\))/col.active_border = rgba(\1FF)/" ~/.config/hypr/hyprland.conf
  sed -i "s/col.inactive_border = .*/col.inactive_border = rgba($background)/" ~/.config/hypr/hyprland.conf
  sed -i "s/col.inactive_border = rgba(#\([0-9A-Fa-f]\{6\}\))/col.inactive_border = rgba(\1FF)/" ~/.config/hypr/hyprland.conf

  # Path to Ghostty Pywal Theme
  THEME_PYWAL_FILE="$HOME/.config/ghostty/themes/pywal"

  # Apply Pywal Ghostty Theme
  sed -i "s/^palette = 0=.*/palette = 0=$color0/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 1=.*/palette = 1=$color1/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 2=.*/palette = 2=$color2/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 3=.*/palette = 3=$color3/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 4=.*/palette = 4=$color4/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 5=.*/palette = 5=$color5/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 6=.*/palette = 6=$color6/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 7=.*/palette = 7=$color7/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 8=.*/palette = 8=$color8/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 9=.*/palette = 9=$color9/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 10=.*/palette = 10=$color10/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 11=.*/palette = 11=$color11/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 12=.*/palette = 12=$color12/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 13=.*/palette = 13=$color13/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 14=.*/palette = 14=$color14/" "$THEME_PYWAL_FILE"
  sed -i "s/^palette = 15=.*/palette = 15=$color15/" "$THEME_PYWAL_FILE"
  sed -i "s/^background = .*/background = $background/" "$THEME_PYWAL_FILE"
  sed -i "s/^foreground = .*/foreground = $foreground/" "$THEME_PYWAL_FILE"
  sed -i "s/^cursor-color = .*/cursor-color = $cursor/" "$THEME_PYWAL_FILE"
}

# Function to change wallpaper only (without pywal)
change_wallpaper_only() {
  # Generate thumbnails
  for img in "$WALLPAPER_DIR"/*.{jpg,jpeg,png}; do
    thumbnail="$THUMBNAIL_DIR/$(basename "$img")"
    if [ ! -f "$thumbnail" ]; then
      convert "$img" -resize 300x300 "$thumbnail" 2>/dev/null
    fi
  done

  # Combine thumbnails and names
  OPTIONS=""
  for img in "$WALLPAPER_DIR"/*.{jpg,jpeg,png}; do
    thumbnail="$THUMBNAIL_DIR/$(basename "$img")"
    OPTIONS+="$(basename "$img")\0icon\x1f$thumbnail\n"
  done

  # Use Rofi to select wallpaper
  SELECTED=$(echo -e "$OPTIONS" | rofi -dmenu -p "Select Wallpaper (No Pywal)")

  # Check wallpaper selection
  if [ -z "$SELECTED" ]; then
    echo "No wallpaper selected. Exiting..."
    exit 1
  fi

  # Full path to the selected wallpaper
  SELECTED_WALLPAPER_PATH="$WALLPAPER_DIR/$SELECTED"

  # Ensure the selected wallpaper exists
  if [ ! -f "$SELECTED_WALLPAPER_PATH" ]; then
    echo "Wallpaper not found: $SELECTED_WALLPAPER_PATH"
    exit 1
  fi

  # Path to replace nostalgia.jpg
  TARGET_WALLPAPER="$HOME/nostalgia.jpg"

  # Convert to JPG if needed
  FILE_EXTENSION="${SELECTED_WALLPAPER_PATH##*.}"
  if [[ "$FILE_EXTENSION" != "jpg" ]]; then
    echo "Converting $SELECTED to JPG format..."
    magick "$SELECTED_WALLPAPER_PATH" "$TARGET_WALLPAPER"
  else
    cp "$SELECTED_WALLPAPER_PATH" "$TARGET_WALLPAPER"
  fi

  echo "Replaced nostalgia.jpg with $SELECTED"

  # Detect Wayland compositor and set wallpaper accordingly
  if command -v hyprctl &> /dev/null; then
    # Hyprland detected - use hyprpaper
    mkdir -p ~/.config/hypr # Create the directory if it doesn't exist

    # Get the list of connected monitors using wlr-randr
    connected_monitors=$(wlr-randr | grep -E "^[A-Za-z0-9-]+" | awk '{print $1}')

    # Clear the hyprpaper.conf file and set preload
    echo "preload = $HOME/nostalgia.jpg" >~/.config/hypr/hyprpaper.conf

    # Loop through each connected monitor and set the wallpaper for it
    for monitor in $connected_monitors; do
      echo "wallpaper = $monitor, $HOME/nostalgia.jpg" >>~/.config/hypr/hyprpaper.conf
    done

    # Disable splash screen
    echo "splash = false" >>~/.config/hypr/hyprpaper.conf

    # Kill existing instances of hyprpaper only
    killall hyprpaper

    # Restart hyprpaper only
    hyprpaper &
  else
    # Other Wayland compositors - use swaybg or similar
    if command -v swaybg &> /dev/null; then
      killall swaybg 2>/dev/null
      swaybg -i "$HOME/nostalgia.jpg" -m fill &
    elif command -v wbg &> /dev/null; then
      killall wbg 2>/dev/null
      wbg "$HOME/nostalgia.jpg" &
    else
      # Fallback to feh if available
      feh --bg-fill "$HOME/nostalgia.jpg" --no-fehbg
    fi
  fi

  echo "Wallpaper changed to $SELECTED without color scheme changes."
}

# Function to select and apply an icon theme
select_icon_theme() {
  # Step 1: List available icon themes from both directories
  ICON_THEMES=$(ls /usr/share/icons ~/.local/share/icons 2>/dev/null | sort -u)

  # Step 2: Use Rofi to select an icon theme
  SELECTED_ICON_THEME=$(echo "$ICON_THEMES" | rofi -dmenu -p "Select Icon Theme")

  # Check icon theme selection
  if [ -z "$SELECTED_ICON_THEME" ]; then
    echo "No icon theme selected. Exiting..."
    exit 1
  fi

  # Step 3: Update the Rofi configuration file with the selected icon theme
  sed -i "s|icon-theme:.*|icon-theme: \"$SELECTED_ICON_THEME\";|" ~/.config/rofi/config.rasi

  echo "Rofi icon theme updated to $SELECTED_ICON_THEME."
}

# Function to change the SDDM wallpaper
change_sddm_wallpaper() {
  # Launch a new terminal (kitty in this case) and run the script
  kitty --title "SDDM Wallpaper Change" -e bash -c "
  # Prompt for sudo password
  echo 'Please enter your sudo password to continue:'
  sudo -v

  # Check if sudo was successful
  if [ \$? -ne 0 ]; then
    echo 'Error: Failed to authenticate with sudo.'
    exit 1
  fi

  # Paths
  jpg_image=\"\$HOME/nostalgia.jpg\"
  png_image='/usr/share/sddm/themes/elarun/images/background.png'
  sddm_conf='/etc/sddm.conf'

  # Check if the JPG file exists
  if [ ! -f \"\$jpg_image\" ]; then
    echo 'Error: \$jpg_image not found!'
    exit 1
  fi

  # Check if magick is installed
  if ! command -v magick &> /dev/null; then
    echo 'Error: magick (ImageMagick) is not installed.'
    exit 1
  fi

  # Convert the JPG image to PNG, run the command with sudo to write to protected directory
  echo 'Converting \$jpg_image to PNG...'
  sudo magick \"\$jpg_image\" \"\$png_image\"

  # Verify if the conversion was successful
  if [ -f \"\$png_image\" ]; then
    echo 'Background image successfully replaced with \$jpg_image.'
  else
    echo 'Error: Conversion failed.'
    exit 1
  fi

  # Check and update /etc/sddm.conf
  echo 'Ensuring /etc/sddm.conf has the correct theme configuration...'
  if [ ! -f \"\$sddm_conf\" ]; then
    echo '/etc/sddm.conf does not exist. Creating it...'
    echo -e '[Theme]\\nCurrent=elarun' | sudo tee \"\$sddm_conf\" > /dev/null
  else
    if grep -q '^[Theme]' \"\$sddm_conf\" && grep -q 'Current=elarun' \"\$sddm_conf\"; then
      echo '/etc/sddm.conf already has the correct configuration.'
    else
      echo 'Updating /etc/sddm.conf with the correct theme configuration...'
      sudo sed -i '/^\[Theme\]/,/^\[/ {/^\\[Theme\\]/!d}' \"\$sddm_conf\" 2>/dev/null || true
      sudo sed -i '/^\[Theme\]/a Current=elarun' \"\$sddm_conf\" || echo -e '[Theme]\\nCurrent=elarun' | sudo tee -a \"\$sddm_conf\" > /dev/null
    fi
  fi

  # Verify the configuration
  if grep -q '^[Theme]' \"\$sddm_conf\" && grep -q 'Current=elarun' \"\$sddm_conf\"; then
    echo 'Theme configuration successfully updated.'
  else
    echo 'Error: Failed to update theme configuration.'
    exit 1
  fi

  # Wait for any key press to exit the terminal and kill kitty terminal
  echo 'Press any key to exit...'
  read -n 1 -s

  # Exit the terminal after key press (will now close kitty window)
  exit
"
}

# Main menu to choose between wallpaper + wal, wallpaper only, icon theme, or change SDDM wallpaper
MAIN_MENU=$(echo -e "Wallpaper + Wal\nWallpaper Only\nIcons Selector\nChange SDDM Wallpaper" | rofi -dmenu -p "Select Option")

# Run the selected option
if [ "$MAIN_MENU" == "Wallpaper + Wal" ]; then
  generate_thumbnails
elif [ "$MAIN_MENU" == "Wallpaper Only" ]; then
  change_wallpaper_only
elif [ "$MAIN_MENU" == "Icons Selector" ]; then
  select_icon_theme
elif [ "$MAIN_MENU" == "Change SDDM Wallpaper" ]; then
  change_sddm_wallpaper
else
  echo "Invalid option selected. Exiting..."
  exit 1
fi