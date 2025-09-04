#!/bin/bash

# GPU Recovery Script for Hyprland
# This script helps recover from GPU flickering and crashes

echo "🔄 GPU Recovery Script Starting..."

# Function to check if Hyprland is running
check_hyprland() {
    if pgrep -x "Hyprland" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to reset GPU state
reset_gpu() {
    echo "🔄 Resetting GPU state..."
    
    # Reset DRM devices
    for device in /dev/dri/card*; do
        if [ -e "$device" ]; then
            echo "Resetting DRM device: $device"
            echo "reset" > "$device" 2>/dev/null || true
        fi
    done
    
    # Reset GPU memory (if possible)
    if command -v nvidia-smi >/dev/null 2>&1; then
        echo "🔄 Resetting NVIDIA GPU..."
        nvidia-smi --gpu-reset >/dev/null 2>&1 || true
    fi
    
    # AMD GPU specific reset (for RX 6700 series)
    if lspci -k | grep -q "AMD/ATI.*Navi 22"; then
        echo "🔄 Resetting AMD RX 6700 GPU..."
        
        # Reset AMD GPU memory management
        echo 1 > /sys/class/drm/card0/device/reset_engine 2>/dev/null || true
        
        # Clear GPU memory
        echo 1 > /sys/class/drm/card0/device/pp_od_clk_voltage 2>/dev/null || true
        
        # Reset power state
        echo "auto" > /sys/class/drm/card0/device/power_dpm_force_performance_level 2>/dev/null || true
        
        # Wait longer for AMD GPU to stabilize
        sleep 5
    fi
    
    # Wait a moment for GPU to stabilize
    sleep 2
}

# Function to restart Hyprland
restart_hyprland() {
    echo "🔄 Restarting Hyprland..."
    
    # Kill existing Hyprland processes
    pkill -f "Hyprland" 2>/dev/null || true
    
    # Wait for processes to end
    sleep 3
    
    # Start Hyprland again
    if [ -n "$DISPLAY" ]; then
        echo "Starting Hyprland..."
        Hyprland &
    else
        echo "No display detected. Please start Hyprland manually."
    fi
}

# Main recovery logic
main() {
    echo "🔍 Checking Hyprland status..."
    
    if check_hyprland; then
        echo "✅ Hyprland is running"
        
        # Check for GPU issues
        if dmesg | grep -i "gpu\|drm\|nvidia\|amd" | tail -5 | grep -i "error\|fail\|crash" >/dev/null 2>&1; then
            echo "⚠️  GPU errors detected in system logs"
            echo "🔄 Initiating GPU recovery..."
            reset_gpu
            restart_hyprland
        else
            echo "✅ No obvious GPU issues detected"
        fi
    else
        echo "❌ Hyprland is not running"
        echo "🔄 Attempting to start Hyprland..."
        reset_gpu
        restart_hyprland
    fi
}

# Run the main function
main

echo "✅ GPU Recovery Script completed"
