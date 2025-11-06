# Hyprland Dotfiles Setup Guide

This guide provides step-by-step instructions for setting up and configuring Hyprland dotfiles, along with essential tools and services.

## Disclaimer

Some assets or configurations in this repository may not be entirely my own work. While I have curated and organized these dotfiles, third-party assets may be unintentionally included. 

By using this repository, you agree to:
- Use these dotfiles mindfully and at your own risk.
- Refrain from using any part of this repository for commercial purposes or behind a paywall.
- Notify me if you discover any third-party assets, so I can address them appropriately.

Thank you for your understanding!

---

## Prerequisites

### General Tools
Install the necessary dependencies:
```bash
sudo pacman -S git stow vim neovim ntfs-3g make cmake gcc python3
```

---

## Installation

### Clone and Stow Dotfiles
1. Clone the repository:
   ```bash
   cd ~
   git clone https://github.com/riskirills66/archdotfiles.git
   cd archdotfiles
   ```

2. Stow the dotfiles:
   ```bash
   stow .
   ```

---

## Software Installation

### Desktop Environment Tools  
Install Hyprland and other essential tools needed for your desktop environment setup. The following packages are included in the command below, with a brief explanation of their purpose:

```bash
sudo pacman -S hyprland sddm flatpak hyprpaper hyprlock waybar cliphist xclip dunst ghostty dolphin rofi slurp \
qt5-wayland qt6-wayland polkit-kde-agent grim noto-fonts noto-fonts-cjk noto-fonts-emoji systemd ttf-fira-code xorg-xrandr \
pipewire networkmanager htop pavucontrol blueman openvpn unrar unzip imagemagick nwg-look mpv rofi-emoji firefox
```

#### Breakdown of Packages:  

- **hyprland**: A dynamic tiling Wayland compositor used as the main desktop environment.  
- **sddm**: A modern and highly customizable display manager (login screen).  
- **flatpak**: A universal package manager for installing and managing applications from Flathub.  
- **hyprpaper**: A lightweight wallpaper manager designed specifically for Hyprland.  
- **hyprlock**: A simple screen locker for Hyprland.  
- **waybar**: A customizable status bar for Wayland-based environments.  
- **cliphist**: Clipboard history manager for managing copied text and images.  
- **dunst**: A lightweight notification daemon to display desktop notifications.  
- **ghostty**: A fast terminal emulator. 
- **dolphin**: A kde bundled file manager. 
- **rofi**: A window switcher, application launcher, and dmenu replacement.  
- **slurp**: A tool to select regions of the screen (useful for screenshots).  
- **qt5-wayland / qt6-wayland**: Enables Wayland support for applications using Qt5 and Qt6 frameworks.  
- **polkit-kde-agent**: A PolicyKit authentication agent for managing administrative actions.  
- **grim**: A screenshot utility for Wayland.  
- **systemd**: Systemd is a system and service manager for Linux, responsible for initializing the system, managing services, and handling various system tasks like process supervision and logging.
- **noto-fonts / noto-fonts-cjk**: High-quality fonts with support for multiple languages, including Chinese, Japanese, and Korean (CJK).  
- **ttf-fira-code**: A font with programming ligatures designed for developers.  
- **pipewire**: A modern multimedia framework for handling audio and video streams.  
- **networkmanager**: A network management tool for connecting to Wi-Fi and wired networks.  
- **htop**: An interactive process viewer for monitoring system resources.  
- **pavucontrol**: A graphical interface for managing audio devices and streams (requires PipeWire or PulseAudio).  
- **blueman**: A GTK-based Bluetooth manager.  
- **openvpn**: An optional VPN client for secure and encrypted connections.  
- **unrar / unzip**: Tools for extracting compressed files in RAR and ZIP formats.  
- **imagemagick**: A versatile image manipulation tool for editing and converting image files.  
- **nwg-look**: A utility for configuring GTK themes in Wayland environments.  
- **firefox**: A popular open-source web browser.  

### Notes:  
- **Optional Packages**:  
  - **openvpn**, **unrar**, and **imagemagick** are optional and included for convenience; feel free to omit them if not needed.  
  - **blueman** is necessary only if you use Bluetooth devices.  
- If you don’t plan to use Flatpak apps, **flatpak** can also be omitted.  

---

### Command-Line Tools  

The following command-line tools are useful for enhancing your workflow and system management. Install them using `pacman`:

```bash
sudo pacman -S fastfetch 
```

#### Breakdown of Packages:

- **fastfetch**:  
  A fast and minimalistic system information tool for the terminal. It provides quick and attractive outputs like CPU, RAM, and GPU information, uptime, and more. It's often used to show off system specs in a clean and visually appealing way.

### Notes:  
- These tools are **recommended** for enhancing your command-line experience, especially for media management (cmus, cava), system info (fastfetch), and file navigation (yazi, fzf).  
- You can omit any tools that you don’t plan on using or don’t find useful for your specific workflow.

---

### Install Yay (AUR Helper)
1. Install prerequisites:
   ```bash
   sudo pacman -S --needed git base-devel
   ```

2. Clone and build Yay:
   ```bash
   git clone https://aur.archlinux.org/yay-bin.git
   cd yay-bin
   makepkg -si
   cd ..
   ```

---

### AUR Packages  

The following tools are **required** to fully configure and utilize your Hyprland setup. Use the `yay` AUR helper to install them:  

```bash
yay -S python-pywal16 wlogout hyprshot xdg-desktop-portal-hyprland-git python-pywalfox walogram-git pywal-spicetify
```

#### Breakdown of Packages:  

- **python-pywal16**:  
  A Python library and CLI tool that generates and applies color schemes based on your wallpaper. This ensures that your terminal and desktop applications have a cohesive, matching theme. Essential for creating a visually consistent setup.  

- **wlogout**:  
  A minimal and customizable logout screen specifically for Wayland environments. It provides options like logout, shutdown, and reboot, tailored for Hyprland's workflow.  

- **hyprshot**:  
  A screenshot utility optimized for Hyprland. It allows you to easily capture specific windows, regions, or the entire screen while respecting Hyprland's compositor behavior.  

- **xdg-desktop-portal-hyprland-git**:  
  A Hyprland-specific implementation of the XDG Desktop Portal. This package is critical for enabling features like screen sharing (e.g., in video conferencing apps), Flatpak sandboxing, and desktop integration with various tools.  

- **python-pywalfox**:  
  A tool that syncs your Firefox theme with your Pywal-generated desktop color scheme. It ensures your browser matches the overall look of your desktop for a cohesive and polished experience.  

- **walogram-git**:  
  A tool that generate telegram-desktop themes based on generated by wal or user defined colors.  

- **pywal-spicetify**:  
  A tool to theme spotify based on pywal (require spicetify and python-pywal16  installed)

### Notes:  
- These AUR packages are **required** for the proper functionality and customization of the Hyprland setup.  
- Ensure that the **yay** AUR helper is installed beforehand (instructions for installing `yay` are provided earlier in this guide).  

To configure Pywalfox:
```bash
pywalfox install
```

To configure pywal-spicetify:
```bash
pywal-spicetify <theme-name> 
```

---

## Zsh Setup

1. Install and set Zsh as the default shell:
   ```bash
   sudo pacman -S zsh
   chsh -s $(which zsh)
   ```
2. Relogin Session
   ```bash
   exit
   ```
---

## Service Configuration

### Enable Bluetooth
```bash
sudo systemctl enable --now bluetooth.service
```

### Enable Network Manager
```bash
sudo systemctl enable --now NetworkManager 
```

### Enable SDDM (Display Manager)
```bash
sudo systemctl enable --now sddm
```
---
## Hyprland Desktop Setup Guide  

Welcome to your new Hyprland desktop environment! After enabling **SDDM**, you’ll need to log in and set up your wallpaper to ensure **Waybar** functions properly.  

### Initial Setup  
Once inside the Hyprland environment, a script will launch **Rofi** with three menu options:  
1. Select the first option: **`Wallpaper + Wal`**.  
2. Choose a wallpaper from the list (located in the **Downloads** directory). This will update both your desktop background and theme.  

### Changing Rofi Icon Themes  
1. Ensure you’ve downloaded additional icon themes (search online for "Gnome icon themes").  
2. Open the initiation menu: `Ctrl + Shift + Alt + Return`.
3. Select the second option: **`Icon Selector`**.  
4. Pick an icon theme from the available list.  

### Updating the SDDM Wallpaper  
1. Open the initiation menu: `Ctrl + Shift + Alt + Return`.  
2. Select the third option: **`Change SDDM Wallpaper`**.  
3. Enter your **sudo** password when prompted.  
4. The script will automatically switch the **SDDM** theme to **Elarun** and set your current wallpaper as the SDDM background.  

### Notes  
- Ensure you have some images in your **Downloads** directory for the wallpaper selection menu to work. If no images are found, the script will automatically add a default wallpaper to the **Downloads** folder.
- Right-clicking on the power icon in the Waybar will bring up this initiation menu.

---

## Oh My Zsh Setup

1. Install **Oh My Zsh**:
   ```bash
   sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
   ```

2. Add plugins:
   ```bash
   git clone https://github.com/zsh-users/zsh-autosuggestions.git $ZSH_CUSTOM/plugins/zsh-autosuggestions
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
   ```

3. Install **Powerlevel10k**:
   ```bash
   git clone https://github.com/romkatv/powerlevel10k.git $ZSH_CUSTOM/themes/powerlevel10k
   ```

4. Update `.zshrc`:
   ```bash
   nvim ~/.zshrc
   ```

   Add or update the following:
   ```bash
   ZSH_THEME="powerlevel10k/powerlevel10k"
   plugins=(
       git
       sudo
       web-search
       archlinux
       zsh-autosuggestions
       zsh-syntax-highlighting
       copyfile
       copybuffer
       dirhistory
       history
   )
   ```

   Add the following functions:
   ```bash
   # yazi function
   function y() {
       local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
       yazi "$@" --cwd-file="$tmp"
       if cwd="$(command cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
           builtin cd -- "$cwd"
       fi
       rm -f -- "$tmp"
   }

   # fzf keybind
   eval "$(fzf --zsh)"

   # Zoxide
   eval "$(zoxide init zsh)"
   alias cd="z"
   alias python="python3"

   # vim = nvim alias
   alias vim=nvim
   ```

---

## Optional Configurations

### OpenVPN Setup

1. **Create Configuration Files**:
   ```bash
   sudo touch /etc/openvpn/client.conf
   sudo touch /etc/openvpn/auth.txt
   ```
   Set permission for configuration:
   ```bash
   sudo chmod 644 /etc/openvpn/auth.txt
   sudo chmod 600 /etc/openvpn/client.conf

2. **Add OpenVPN Configuration**:
   Open `/etc/openvpn/client.conf`:
   ```bash
   sudo nvim /etc/openvpn/client.conf
   ```
   Add your OpenVPN server configuration. Example:
   ```
   client
   dev tun
   proto udp
   remote your.vpn.server 1194
   resolv-retry infinite
   nobind
   persist-key
   persist-tun
   auth-user-pass /etc/openvpn/auth.txt
   cipher AES-256-CBC
   verb 3
   ```

3. **Add Authentication Credentials**:
   Open `/etc/openvpn/auth.txt`:
   ```
   username
   password
   ```

4. **Enable and Start OpenVPN Service**:
   ```bash
   sudo systemctl edit openvpn-client@client.service
   ```

   add
   ```bash
   [Service]
   ExecStart=
   ExecStart=/usr/bin/openvpn --suppress-timestamps --nobind --config /etc/openvpn/client.conf
   ``` 
   
   start service
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now openvpn-client@client.service
   ```

---

### Wine Setup (32-bit Prefix)

1. Install Wine and dependencies:
   ```bash
   sudo pacman -S wine winetricks wine-mono wine-gecko
   ```

2. Create a 32-bit Wine prefix:
   ```bash
   WINEPREFIX=~/32 winecfg
   ```

3. (Optional) Install .NET frameworks:
   ```bash
   WINEPREFIX=~/32 winetricks dotnet35 dotnet45
   ```

4. Run a Windows application:
   ```bash
   WINEPREFIX=~/32 wine start /d /path/to/executable_dir app_name.exe
   ```
5. Create desktop entry for wine application:
   Create ~/.local/share/applications/applicationname.desktop
   ```bash
   [Desktop Entry]
   Version=1.0
   Type=Application
   Name=Application Name 
   Exec=bash -c "WINEPREFIX=~/32 wine start /d /path/to/application application.exe"
   Icon=wine
   Terminal=false
   Categories=Office;
   ```
---

### Additional Software
#### TUI Tools

pacman:
  ```bash
  sudo pacman -S yazi fzf swayimg ripgrep cmus ffmpeg p7zip jq poppler fd ripgrep fzf zoxide imagemagick
  ```
- **yazi**:  
  A terminal-based utility for navigating and managing directories. It provides an easy way to search through and open directories directly from the command line, improving your workflow when dealing with file systems.

- **fzf**:  
  A command-line fuzzy finder that allows you to quickly search and filter through files, directories, command history, and more. It's a powerful tool for enhancing productivity by speeding up file navigation and command execution.

- **swayimg**:  
  A simple image viewer for the terminal designed to work with the Sway compositor. It allows you to view images directly from the terminal window, which is handy for quick image viewing without leaving the command line.

- **cmus**:  
  A fast and lightweight music player for the terminal. It supports a variety of audio formats and provides a simple yet effective way to manage and play music directly from the command line. Perfect for users who prefer a keyboard-driven interface.

yay:
  ```bash
  yay -S Cava
  yay -S nchat-git
  ```

- **cava**:  
  A terminal-based audio visualizer that displays an interactive visualization of your system's audio output. It can be used alongside cmus or any other music player for a visually engaging experience while listening to music.


#### GUI Tools
- **LibreOffice**:  
  ```bash
  sudo pacman -S libreoffice
  ```

- **GIMP, Inkscape, Thunderbird**:  
  ```bash
  sudo pacman -S thunderbird gimp inkscape
  ```

- **Discord**:  
  ```bash
  sudo pacman -S discord
  ```

- **Telegram**:  
  ```bash
  sudo pacman -S telegram-desktop
  ```

#### Flatpak Software
- **AnyDesk**:  
  ```bash
  flatpak install flathub com.anydesk.Anydesk
  ```

- **Fragments (Torrent Manager)**:  
  ```bash
  flatpak install flathub de.haeckerfelix.Fragments
  ```

- **Smile**:  
  ```bash
  flatpak install flathub it.mijorus.smile
  ```

### Set Yazi and Swayimg as defaults:

#### Setting Yazi as the Default Directory Opener
1. Create a .desktop File
  Create a .desktop entry file to integrate Yazi with your system. Save the following content as ~/.local/share/applications/openinyazi.desktop:

  ```bash
  [Desktop Entry]
  Version=1.0
  Name=Open in Yazi
  Comment=Open Yazi in a Ghostty terminal window
  Exec=/home/your-username/scripts/openinyazi.sh %U
  Icon=utilities-terminal
  Terminal=false
  Type=Application
  Categories=Utility;
  MimeType=x-scheme-handler/file;[Desktop Entry]
  ```
  Replace `your-username` with your actual username.
  
2. Set Yazi as Default Directory Opener:
  Use xdg-mime to set Yazi as the default handler for directories:
  ```bash
  xdg-mime default openinyazi.desktop inode/directory
  ```

#### Setting Swayimg as Default Image Opener:
1. Create a .desktop File for Swayimg
  Create a .desktop entry file for Swayimg in ~/.local/share/applications/swayimg.desktop:

  ```bash
  [Desktop Entry]
  Name=Swayimg
  Comment=Lightweight image viewer for Wayland
  Exec=swayimg %f
  Terminal=false
  Type=Application
  MimeType=image/png;image/jpeg;image/gif;image/bmp;image/webp;image/tiff;image/x-icon;
  Categories=Graphics;Viewer;
  ```
2. Set Swayimg as Default Image Viewer
  Use xdg-mime to set Swayimg as the default handler for images:

  ```bash
  xdg-mime default swayimg.desktop image/png
  xdg-mime default swayimg.desktop image/jpeg
  xdg-mime default swayimg.desktop image/gif
  xdg-mime default swayimg.desktop image/bmp
  xdg-mime default swayimg.desktop image/webp
  xdg-mime default swayimg.desktop image/tiff
  xdg-mime default swayimg.desktop image/x-icon
  ```

### Notes:
- **OpenVPN**, **Wine**, and the additional software listed above are entirely optional and are not dependencies for Hyprland setup.
- Only install these if you require their functionality.
