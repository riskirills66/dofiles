#!/bin/bash

# GPU Protection Startup Script
# Ensures all GPU protection services start automatically

echo "🚀 Starting GPU Protection Services..."

# Wait for Hyprland to be ready
sleep 5

# Start auto-recovery service if not already running
if ! pgrep -f "auto-gpu-recovery.sh" >/dev/null; then
    echo "🤖 Starting auto-recovery service..."
    ~/.config/hypr/auto-gpu-recovery.sh &
    sleep 2
fi

# Check if services are running
echo "📊 GPU Protection Status:"
if pgrep -f "auto-gpu-recovery.sh" >/dev/null; then
    echo "✅ Auto-recovery service: Running"
else
    echo "❌ Auto-recovery service: Failed to start"
fi

# Check Hyprland status
if pgrep -x "Hyprland" >/dev/null; then
    echo "✅ Hyprland: Running"
else
    echo "❌ Hyprland: Not running"
fi

echo "🎉 GPU Protection startup complete!"
