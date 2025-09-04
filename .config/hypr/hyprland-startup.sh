#!/bin/bash

# Robust Hyprland Startup Script
# Handles dependencies and provides crash recovery

echo "🚀 Starting Hyprland with enhanced stability..."

# Function to check dependencies
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    # Check for essential Wayland components
    local missing_deps=()
    
    if ! command -v Hyprland >/dev/null 2>&1; then
        missing_deps+=("Hyprland")
    fi
    
    if ! command -v wlroots >/dev/null 2>&1; then
        missing_deps+=("wlroots")
    fi
    
    if ! command -v dbus-launch >/dev/null 2>&1; then
        missing_deps+=("dbus")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "❌ Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    echo "✅ All dependencies found"
    return 0
}

# Function to setup environment
setup_environment() {
    echo "🔧 Setting up environment..."
    
    # Set Wayland display
    export WAYLAND_DISPLAY=wayland-1
    
    # Set XDG directories
    export XDG_SESSION_TYPE=wayland
    export XDG_CURRENT_DESKTOP=Hyprland
    
    # Set Hyprland specific variables
    export HYPRLAND_LOG_WLR=1
    export HYPRLAND_NO_SD_NOTIFY=1
    
    # GPU stability (universal)
    export WLR_NO_HARDWARE_CURSORS=1
    export WLR_DRM_NO_ATOMIC=1
    export WLR_RENDERER=vulkan
    
    # OpenGL settings
    export __GL_SYNC_TO_VBLANK=0
    export __GL_THREADED_OPTIMIZATIONS=1
    
    echo "✅ Environment configured"
}

# Function to stop conflicting services
stop_conflicting_services() {
    echo "🛑 Stopping conflicting services..."
    
    # Stop any existing Hyprland instances
    pkill -f "Hyprland" 2>/dev/null || true
    sleep 2
    
    # Stop any existing Wayland sessions
    pkill -f "weston\|sway\|river" 2>/dev/null || true
    
    # Stop any existing X11 sessions
    pkill -f "startx\|xinit\|Xorg" 2>/dev/null || true
    
    # Wait for processes to end
    sleep 3
    
    echo "✅ Conflicting services stopped"
}

# Function to start required services
start_required_services() {
    echo "🔧 Starting required services..."
    
    # Start dbus if not running
    if ! pgrep -x "dbus-daemon" >/dev/null; then
        echo "Starting dbus..."
        dbus-launch --exit-with-session &
        sleep 2
    fi
    
    # Start polkit if not running
    if ! pgrep -x "polkit-gnome-authentication-agent-1" >/dev/null; then
        echo "Starting polkit..."
        /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &
        sleep 1
    fi
    
    echo "✅ Required services started"
}

# Function to start Hyprland with error handling
start_hyprland() {
    echo "🎯 Starting Hyprland..."
    
    # Start Hyprland in background
    Hyprland &
    local hyprland_pid=$!
    
    # Wait for Hyprland to initialize
    echo "⏳ Waiting for Hyprland to initialize..."
    sleep 5
    
    # Check if Hyprland is still running
    if ! kill -0 $hyprland_pid 2>/dev/null; then
        echo "❌ Hyprland failed to start"
        return 1
    fi
    
    # Check if Wayland display is available
    if ! timeout 10 bash -c 'until [ -S "$XDG_RUNTIME_DIR/wayland-1" ]; do sleep 0.1; done'; then
        echo "❌ Wayland display not available"
        kill $hyprland_pid 2>/dev/null || true
        return 1
    fi
    
    echo "✅ Hyprland started successfully (PID: $hyprland_pid)"
    return 0
}

# Function to monitor Hyprland
monitor_hyprland() {
    local hyprland_pid=$1
    
    echo "👀 Monitoring Hyprland..."
    
    while kill -0 $hyprland_pid 2>/dev/null; do
        sleep 5
        
        # Check for GPU errors
        local gpu_errors=$(journalctl --since "1 minute ago" | grep -c "amdgpu.*fault\|amdgpu.*error" 2>/dev/null || echo "0")
        
        if [ "$gpu_errors" -gt 0 ]; then
            echo "⚠️  GPU errors detected, attempting recovery..."
            # Trigger GPU recovery
            ~/.config/hypr/gpu-recovery.sh &
        fi
    done
    
    echo "❌ Hyprland process ended"
}

# Main startup sequence
main() {
    echo "🚀 Hyprland Enhanced Startup Sequence"
    echo "====================================="
    
    # Check dependencies
    if ! check_dependencies; then
        echo "❌ Cannot start Hyprland - missing dependencies"
        exit 1
    fi
    
    # Setup environment
    setup_environment
    
    # Stop conflicting services
    stop_conflicting_services
    
    # Start required services
    start_required_services
    
    # Start Hyprland
    if start_hyprland; then
        local hyprland_pid=$(pgrep -x "Hyprland")
        echo "🎉 Hyprland is running! PID: $hyprland_pid"
        
        # Monitor Hyprland
        monitor_hyprland $hyprland_pid
    else
        echo "❌ Failed to start Hyprland"
        exit 1
    fi
}

# Run main function
main
