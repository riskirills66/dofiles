#!/bin/bash

# Check Auto-Recovery Service Status
echo "🤖 Auto-Recovery Service Status Check"
echo "====================================="

# Check if service is running
if pgrep -f "auto-gpu-recovery.sh" >/dev/null; then
    pid=$(pgrep -f "auto-gpu-recovery.sh")
    echo "✅ Service is running (PID: $pid)"
    
    # Check if it's monitoring
    if [ -e "/tmp/auto-gpu-recovery.lock" ]; then
        lock_pid=$(cat "/tmp/auto-gpu-recovery.lock" 2>/dev/null)
        if [ "$lock_pid" = "$pid" ]; then
            echo "✅ Service has active lock (PID: $lock_pid)"
        else
            echo "⚠️  Lock file mismatch (lock PID: $lock_pid, actual PID: $pid)"
        fi
    else
        echo "⚠️  No lock file found"
    fi
    
    # Check recent GPU activity
    echo ""
    echo "📊 Recent GPU Activity (last 2 minutes):"
    gpu_faults=$(journalctl --since "2 minutes ago" | grep -c "amdgpu.*fault\|amdgpu.*error" 2>/dev/null || echo "0")
    echo "   GPU Faults: $gpu_faults"
    
    hyprland_crashes=$(journalctl --since "2 minutes ago" | grep -c "Hyprland.*terminated\|Hyprland.*dumped\|signal 6\|ABRT" 2>/dev/null || echo "0")
    echo "   Hyprland Crashes: $hyprland_crashes"
    
    # Check if we're in a Hyprland session
    echo ""
    echo "🎯 Session Status:"
    if [ -n "$HYPRLAND_INSTANCE_SIGNATURE" ]; then
        echo "   ✅ In Hyprland session (signature: $HYPRLAND_INSTANCE_SIGNATURE)"
    else
        echo "   ❌ Not in Hyprland session"
    fi
    
    if [ -n "$WAYLAND_DISPLAY" ]; then
        echo "   ✅ Wayland display: $WAYLAND_DISPLAY"
    else
        echo "   ❌ No Wayland display"
    fi
    
    echo ""
    echo "💡 The service is monitoring and will automatically:"
    echo "   • Fix GPU issues when detected"
    echo "   • Restart Hyprland only if not in a session"
    echo "   • Prevent nested Hyprland instances"
    
else
    echo "❌ Service is not running"
    echo ""
    echo "💡 To start the service:"
    echo "   Press SUPER + CTRL + A"
    echo "   or run: ./auto-gpu-recovery.sh &"
fi
