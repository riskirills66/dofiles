#!/bin/bash

# Quick Status Check Script
# Shows current Hyprland and GPU status

echo "🔍 Quick Status Check - $(date)"
echo "====================================="

# Check Hyprland status
echo "🎯 Hyprland Status:"
if pgrep -x "Hyprland" >/dev/null; then
    hyprland_pid=$(pgrep -x "Hyprland")
    echo "✅ Running (PID: $hyprland_pid)"
    
    # Check if it's responding
    if timeout 5 hyprctl version >/dev/null 2>&1; then
        echo "✅ Responding to commands"
    else
        echo "⚠️  Not responding to commands"
    fi
else
    echo "❌ Not running"
fi

echo ""

# Check GPU status
echo "🎮 GPU Status:"
if lspci -k | grep -q "AMD/ATI.*Navi 22"; then
    echo "🔴 AMD RX 6700 Series detected"
    
    # Check for recent GPU errors
    recent_errors=$(journalctl --since "5 minutes ago" | grep -c "amdgpu.*fault\|amdgpu.*error" 2>/dev/null || echo "0")
    if [ "$recent_errors" -gt 0 ] 2>/dev/null; then
        echo "⚠️  Recent GPU errors: $recent_errors in last 5 minutes"
    else
        echo "✅ No recent GPU errors"
    fi
    
    # Check GPU temperature
    if [ -e "/sys/class/drm/card0/device/hwmon/hwmon*/temp1_input" ]; then
        for temp_file in /sys/class/drm/card0/device/hwmon/hwmon*/temp1_input; do
            if [ -e "$temp_file" ]; then
                local temp=$(cat "$temp_file" 2>/dev/null)
                if [ -n "$temp" ]; then
                    echo "🌡️  Temperature: $((temp/1000))°C"
                fi
                break
            fi
        done
    fi
else
    echo "❓ GPU type not detected"
fi

echo ""

# Check for recent crashes
echo "💥 Recent Crashes:"
recent_crashes=$(journalctl --since "10 minutes ago" | grep -c "Hyprland.*terminated\|Hyprland.*dumped\|signal 6\|ABRT" 2>/dev/null || echo "0")
if [ "$recent_crashes" -gt 0 ]; then
    echo "⚠️  Recent crashes: $recent_crashes in last 10 minutes"
else
    echo "✅ No recent crashes"
fi

echo ""

# Check auto-recovery service
echo "🤖 Auto-Recovery Service:"
if pgrep -f "auto-gpu-recovery.sh" >/dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running (press SUPER + CTRL + A to start)"
fi

echo ""
echo "💡 Keybindings:"
echo "   SUPER + CTRL + A: Start auto-recovery service"
echo "   SUPER + CTRL + R: Emergency GPU recovery"
echo "   SUPER + CTRL + M: AMD GPU monitoring"
echo "   SUPER + CTRL + S: Enhanced Hyprland startup"
