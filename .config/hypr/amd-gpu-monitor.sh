#!/bin/bash

# AMD GPU Monitor Script for RX 6700 Series
# Monitors for GCVM_L2_PROTECTION_FAULT and other AMD-specific issues

echo "🔍 AMD GPU Monitor Starting..."

# Function to check for AMD GPU faults
check_amd_faults() {
    local fault_count=$(journalctl --since "5 minutes ago" | grep -c "amdgpu.*fault\|amdgpu.*error\|GCVM_L2_PROTECTION_FAULT")
    
    if [ "$fault_count" -gt 0 ]; then
        echo "⚠️  AMD GPU faults detected: $fault_count in last 5 minutes"
        return 1
    else
        echo "✅ No AMD GPU faults detected"
        return 0
    fi
}

# Function to check GPU memory status
check_gpu_memory() {
    if [ -e "/sys/class/drm/card0/device/mem_info_vram_total" ]; then
        local total_vram=$(cat /sys/class/drm/card0/device/mem_info_vram_total 2>/dev/null)
        local used_vram=$(cat /sys/class/drm/card0/device/mem_info_vram_used 2>/dev/null)
        
        if [ -n "$total_vram" ] && [ -n "$used_vram" ]; then
            echo "💾 GPU Memory: ${used_vram}MB / ${total_vram}MB"
        fi
    fi
}

# Function to check GPU temperature and power
check_gpu_status() {
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
    
    if [ -e "/sys/class/drm/card0/device/power_dpm_force_performance_level" ]; then
        local power_level=$(cat /sys/class/drm/card0/device/power_dpm_force_performance_level 2>/dev/null)
        echo "⚡ Power Level: ${power_level:-unknown}"
    fi
}

# Function to prevent GPU faults
prevent_faults() {
    echo "🛡️  Applying AMD GPU fault prevention..."
    
    # Set conservative power management
    if [ -e "/sys/class/drm/card0/device/power_dpm_force_performance_level" ]; then
        echo "auto" > /sys/class/drm/card0/device/power_dpm_force_performance_level 2>/dev/null || true
    fi
    
    # Reduce memory clock if possible
    if [ -e "/sys/class/drm/card0/device/pp_od_clk_voltage" ]; then
        echo "s 0 800 750" > /sys/class/drm/card0/device/pp_od_clk_voltage 2>/dev/null || true
    fi
    
    # Set memory timing to conservative values
    if [ -e "/sys/class/drm/card0/device/pp_od_clk_voltage" ]; then
        echo "m 0 2000 875" > /sys/class/drm/card0/device/pp_od_clk_voltage 2>/dev/null || true
    fi
}

# Function to emergency reset if too many faults
emergency_reset() {
    local fault_count=$(journalctl --since "1 minute ago" | grep -c "amdgpu.*fault\|amdgpu.*error\|GCVM_L2_PROTECTION_FAULT")
    
    if [ "$fault_count" -gt 5 ]; then
        echo "🚨 EMERGENCY: Too many GPU faults detected! Resetting GPU..."
        echo 1 > /sys/class/drm/card0/device/reset_engine 2>/dev/null || true
        sleep 3
        
        # Restart Hyprland if it's running
        if pgrep -x "Hyprland" > /dev/null; then
            echo "🔄 Restarting Hyprland..."
            pkill -f "Hyprland" 2>/dev/null || true
            sleep 2
            Hyprland &
        fi
    fi
}

# Main monitoring loop
main() {
    echo "🔍 Starting AMD GPU monitoring..."
    
    while true; do
        echo "--- $(date) ---"
        
        # Check for faults
        if ! check_amd_faults; then
            prevent_faults
            emergency_reset
        fi
        
        # Check GPU status
        check_gpu_memory
        check_gpu_status
        
        echo ""
        
        # Wait before next check
        sleep 30
    done
}

# Run the main function
main

