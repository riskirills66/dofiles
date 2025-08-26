#!/usr/bin/env bash
# Wineprefix setup script for Adobe Illustrator on Linux

# === CONFIGURATION ===
WINEPREFIX="$HOME/.wine-illustrator"
WINEARCH="win64"
ILLUSTRATOR_VERSION="CC2019" # Change if using CS6, CC2020, etc.

# === CREATE WINEPREFIX ===
echo "[*] Creating Wine prefix at $WINEPREFIX ..."
WINEARCH=$WINEARCH WINEPREFIX=$WINEPREFIX wineboot --init

# === INSTALL DEPENDENCIES ===
echo "[*] Installing required winetricks packages ..."
WINEPREFIX=$WINEPREFIX winetricks -q \
  vcrun2015 \
  vcrun2019 \
  atmlib \
  corefonts \
  msxml6 \
  gdiplus \
  fontsmooth=rgb

# (Optional) Needed if using Creative Cloud installer
if [[ "$ILLUSTRATOR_VERSION" =~ "CC" ]]; then
  echo "[*] Installing additional CC dependencies ..."
  WINEPREFIX=$WINEPREFIX winetricks -q \
    dotnet48 \
    adobeair
fi

# === RECOMMENDED SETTINGS ===
echo "[*] Setting Wine registry tweaks ..."
# Disable GPU acceleration (can cause crashes in Illustrator)
cat >disable_gpu.reg <<EOF
[HKEY_CURRENT_USER\Software\Adobe\Adobe Illustrator\23.0]
"EnableGPUPerformance"=dword:00000000
EOF

WINEPREFIX=$WINEPREFIX wine regedit disable_gpu.reg
rm disable_gpu.reg

echo "[*] Done!"
echo "Now install Illustrator into this prefix with:"
echo "  WINEPREFIX=$WINEPREFIX wine setup.exe"
