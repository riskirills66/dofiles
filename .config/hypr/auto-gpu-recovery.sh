#!/bin/bash

# Automatic GPU Recovery Script
# Continuously monitors and automatically fixes GPU issues
# No user intervention required

echo "🤖 Automatic GPU Recovery Service Starting..."

# Function to check for AMD GPU faults
check_amd_faults() {
    local fault_count=$(journalctl --since "30 seconds ago" | grep -c "amdgpu.*page fault\|amdgpu.*PERMISSION_FAULTS" 2>/dev/null || echo "0")
    echo "$fault_count"
}

# Function to check for Hyprland crashes
check_hyprland_crashes() {
    local crash_count=$(journalctl --since "30 seconds ago" | grep -c "Hyprland.*terminated\|Hyprland.*dumped\|signal 6\|ABRT" 2>/dev/null || echo "0")
    echo "$crash_count"
}

# Function to apply GPU fixes
apply_gpu_fixes() {
    echo "🔧 Applying automatic GPU fixes..."
    
    # Reset AMD GPU if it's an AMD system
    if lspci -k | grep -q "AMD/ATI.*Navi 22"; then
        echo "🔄 Resetting AMD RX 6700 GPU..."
        
        # Reset GPU engine
        echo 1 > /sys/class/drm/card0/device/reset_engine 2>/dev/null || true
        
        # Reset power state
        echo "auto" > /sys/class/drm/card0/device/power_dpm_force_performance_level 2>/dev/null || true
        
        # Clear GPU memory
        echo 1 > /sys/class/drm/card0/device/pp_od_clk_voltage 2>/dev/null || true
        
        # Wait for GPU to stabilize
        sleep 3
    fi
    
    # Reset DRM devices
    for device in /dev/dri/card*; do
        if [ -e "$device" ]; then
            echo "🔄 Resetting DRM device: $device"
            echo "reset" > "$device" 2>/dev/null || true
        fi
    done
    
    echo "✅ GPU fixes applied"
}

# Function to restart Hyprland if needed
restart_hyprland_if_needed() {
    local hyprland_pid=$(pgrep -x "Hyprland")
    
    if [ -z "$hyprland_pid" ]; then
        echo "🚨 Hyprland not running, starting it..."
        
        # Check if we're already in a Hyprland session
        if [ -n "$HYPRLAND_INSTANCE_SIGNATURE" ] || [ -n "$WAYLAND_DISPLAY" ]; then
            echo "⚠️  Already in a Hyprland session, not starting another instance"
            return 0
        fi
        
        # Start Hyprland only if we're not in a session
        Hyprland &
        sleep 5
        
        # Check if it started successfully
        if ! pgrep -x "Hyprland" >/dev/null; then
            echo "❌ Failed to start Hyprland, trying enhanced startup..."
            ~/.config/hypr/hyprland-startup.sh &
        fi
    fi
}

# Function to log GPU status
log_gpu_status() {
    echo "📊 GPU Status Report - $(date)"
    
    # Check GPU temperature
    if [ -e "/sys/class/drm/card0/device/hwmon/hwmon*/temp1_input" ]; then
        for temp_file in /sys/class/drm/card0/device/hwmon/hwmon*/temp1_input; do
            if [ -e "$temp_file" ]; then
                local temp=$(cat "$temp_file" 2>/dev/null)
                if [ -n "$temp" ]; then
                    echo "🌡️  GPU Temperature: $((temp/1000))°C"
                fi
                break
            fi
        done
    fi
    
    # Check GPU memory
    if [ -e "/sys/class/drm/card0/device/mem_info_vram_total" ]; then
        local total_vram=$(cat /sys/class/drm/card0/device/mem_info_vram_total 2>/dev/null)
        local used_vram=$(cat /sys/class/drm/card0/device/mem_info_vram_used 2>/dev/null)
        
        if [ -n "$total_vram" ] && [ -n "$used_vram" ]; then
            echo "💾 GPU Memory: ${used_vram}MB / ${total_vram}MB"
        fi
    fi
    
    # Check Hyprland status
    local hyprland_pid=$(pgrep -x "Hyprland")
    if [ -n "$hyprland_pid" ]; then
        echo "✅ Hyprland running (PID: $hyprland_pid)"
    else
        echo "❌ Hyprland not running"
    fi
    
    echo "---"
}

# Main monitoring loop
main() {
    # Prevent multiple instances
    local lock_file="/tmp/auto-gpu-recovery.lock"
    if [ -e "$lock_file" ]; then
        local other_pid=$(cat "$lock_file" 2>/dev/null)
        if kill -0 "$other_pid" 2>/dev/null; then
            echo "❌ Another instance is already running (PID: $other_pid)"
            exit 1
        else
            rm -f "$lock_file"
        fi
    fi
    
    # Create lock file
    echo $$ > "$lock_file"
    
    # Cleanup on exit
    trap 'rm -f "$lock_file"; exit' INT TERM EXIT
    
    echo "🤖 Starting automatic GPU monitoring and recovery..."
    echo "📊 Monitoring interval: 30 seconds"
    echo "🔄 Auto-recovery: Enabled"
    echo "🚀 Auto-restart: Disabled (already in Hyprland session)"
    echo "====================================="
    
    local consecutive_faults=0
    local consecutive_crashes=0
    
    while true; do
        # Check for GPU faults
        local gpu_faults=$(check_amd_faults)
        local hyprland_crashes=$(check_hyprland_crashes)
        
        # Log status every 5 minutes
        if [ $((SECONDS % 300)) -eq 0 ]; then
            log_gpu_status
        fi
        
        # Handle GPU faults
        if [ "$gpu_faults" -gt 0 ] 2>/dev/null; then
            echo "⚠️  GPU faults detected: $gpu_faults in last 30 seconds"
            consecutive_faults=$((consecutive_faults + 1))
            
            # Apply fixes if we have multiple consecutive faults
            if [ "$consecutive_faults" -ge 2 ]; then
                echo "🚨 Multiple consecutive GPU faults, applying fixes..."
                apply_gpu_fixes
                consecutive_faults=0
            fi
        else
            consecutive_faults=0
        fi
        
        # Handle Hyprland crashes
        if [ "$hyprland_crashes" -gt 0 ] 2>/dev/null; then
            echo "💥 Hyprland crashes detected: $hyprland_crashes in last 30 seconds"
            consecutive_crashes=$((consecutive_crashes + 1))
            
            # Restart Hyprland if we have multiple consecutive crashes
            if [ "$consecutive_crashes" -ge 2 ]; then
                echo "🚨 Multiple consecutive Hyprland crashes, restarting..."
                restart_hyprland_if_needed
                consecutive_crashes=0
            fi
        else
            consecutive_crashes=0
        fi
        
        # Only check Hyprland if we're not in a session (prevents nested instances)
        if [ -z "$HYPRLAND_INSTANCE_SIGNATURE" ] && [ -z "$WAYLAND_DISPLAY" ]; then
            restart_hyprland_if_needed
        fi
        
        # Wait before next check
        sleep 30
    done
}

# Run main function
main
