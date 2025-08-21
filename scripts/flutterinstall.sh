#!/usr/bin/env bash
set -e

# === CONFIG ===
FLUTTER_VERSION="stable"
ANDROID_SDK_ROOT="$HOME/Android/Sdk"
FLUTTER_DIR="$HOME/flutter"

# === Install prerequisites ===
echo "[*] Installing prerequisites..."
sudo pacman -Syu --needed --noconfirm git curl unzip xz jdk17-openjdk wget base-devel

# === Install Flutter ===
if [ ! -d "$FLUTTER_DIR" ]; then
  echo "[*] Cloning Flutter ($FLUTTER_VERSION)..."
  git clone https://github.com/flutter/flutter.git -b $FLUTTER_VERSION $FLUTTER_DIR
else
  echo "[*] Flutter already exists at $FLUTTER_DIR"
fi

export PATH="$FLUTTER_DIR/bin:$PATH"

# === Install Android SDK (minimal) ===
echo "[*] Setting up Android SDK..."
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
cd "$ANDROID_SDK_ROOT/cmdline-tools"

if [ ! -d "latest" ]; then
  curl -Lo sdk-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
  unzip sdk-tools.zip -d temp
  mv temp/cmdline-tools latest
  rm -rf sdk-tools.zip temp
fi

export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

yes | sdkmanager --licenses

sdkmanager --install \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0"

# === Verify ===
echo "[*] Running flutter doctor..."
flutter doctor

echo
echo "[✓] Flutter + minimal Android SDK installed successfully!"
echo "Add this to your ~/.bashrc or ~/.zshrc:"
echo "    export PATH=\"$FLUTTER_DIR/bin:\$PATH\""
echo "    export ANDROID_HOME=\"$ANDROID_SDK_ROOT\""
echo "    export PATH=\"\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH\""
