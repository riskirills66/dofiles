#!/bin/bash

# GPU Auto-Configuration Script
# Automatically detects GPU type and applies appropriate settings
# Safe to run on any system - will work with NVIDIA, AMD, Intel, or any other GPU

echo "🔍 GPU Auto-Configuration Script Starting..."

# Function to detect GPU type
detect_gpu() {
    local gpu_info=$(lspci -k | grep -A 2 -i vga | head -3)
    
    if echo "$gpu_info" | grep -qi "nvidia"; then
        echo "nvidia"
    elif echo "$gpu_info" | grep -qi "amd\|ati"; then
        echo "amd"
    elif echo "$gpu_info" | grep -qi "intel"; then
        echo "intel"
    else
        echo "unknown"
    fi
}

# Function to apply NVIDIA settings
apply_nvidia_settings() {
    echo "🟢 Applying NVIDIA GPU settings..."
    
    # NVIDIA specific environment variables
    export __NV_PRIME_RENDER_OFFLOAD=1
    export __GLX_VENDOR_LIBRARY_NAME=nvidia
    export __VK_LAYER_NV_optimus=NVIDIA_only
    
    # NVIDIA kernel parameters (if available)
    if [ -e "/sys/module/nvidia/parameters" ]; then
        echo "NVIDIA kernel module detected"
    fi
}

# Function to apply AMD settings
apply_amd_settings() {
    echo "🔴 Applying AMD GPU settings..."
    
    # AMD specific environment variables
    export MESA_GL_VERSION_OVERRIDE=4.5
    export MESA_GLSL_VERSION_OVERRIDE=450
    export MESA_GLTHREAD=1
    export AMDGPU_SI_SUPPORT=1
    export AMDGPU_CIK_SUPPORT=1
    
    # AMD GPU Memory Management Fixes (for RX 6700 series and others)
    export AMDGPU_GFXHUB_MMIO_OFFSET=0x00000000
    export AMDGPU_GFXHUB_MMIO_SIZE=0x00000000
    export AMDGPU_GFXHUB_MMIO_OFFSET_2=0x00000000
    export AMDGPU_GFXHUB_MMIO_SIZE_2=0x00000000
}

# Function to apply Intel settings
apply_intel_settings() {
    echo "🔵 Applying Intel GPU settings..."
    
    # Intel specific environment variables
    export INTEL_DEVICE_SCALE_FACTOR=1
    
    # Intel GPU stability
    export MESA_GL_VERSION_OVERRIDE=4.5
    export MESA_GLSL_VERSION_OVERRIDE=450
}

# Function to apply universal settings (safe on all GPUs)
apply_universal_settings() {
    echo "🌐 Applying universal GPU stability settings..."
    
    # Universal environment variables (safe on all systems)
    export WLR_NO_HARDWARE_CURSORS=1
    export WLR_DRM_NO_ATOMIC=1
    export WLR_RENDERER=vulkan
    export __GL_SYNC_TO_VBLANK=0
    export __GL_THREADED_OPTIMIZATIONS=1
}

# Function to create GPU-specific config
create_gpu_config() {
    local gpu_type=$1
    local config_dir="$HOME/.config/hypr"
    
    echo "📝 Creating GPU-specific configuration..."
    
    # Create GPU-specific config file
    cat > "$config_dir/gpu-config-$gpu_type.conf" << EOF
# Auto-generated GPU configuration for $gpu_type
# Generated on: $(date)
# GPU detected: $(lspci -k | grep -A 2 -i vga | head -1)

# GPU Type: $gpu_type
EOF
    
    # Add GPU-specific settings
    case $gpu_type in
        "nvidia")
            cat >> "$config_dir/gpu-config-$gpu_type.conf" << 'EOF'
# NVIDIA specific settings
env = __NV_PRIME_RENDER_OFFLOAD,1
env = __GLX_VENDOR_LIBRARY_NAME,nvidia
env = __VK_LAYER_NV_optimus,NVIDIA_only
EOF
            ;;
        "amd")
            cat >> "$config_dir/gpu-config-$gpu_type.conf" << 'EOF'
# AMD specific settings
env = MESA_GL_VERSION_OVERRIDE,4.5
env = MESA_GLSL_VERSION_OVERRIDE,450
env = MESA_GLTHREAD,1
env = AMDGPU_SI_SUPPORT,1
env = AMDGPU_CIK_SUPPORT,1
env = AMDGPU_GFXHUB_MMIO_OFFSET,0x00000000
env = AMDGPU_GFXHUB_MMIO_SIZE,0x00000000
env = AMDGPU_GFXHUB_MMIO_OFFSET_2,0x00000000
env = AMDGPU_GFXHUB_MMIO_SIZE_2,0x00000000
EOF
            ;;
        "intel")
            cat >> "$config_dir/gpu-config-$gpu_type.conf" << 'EOF'
# Intel specific settings
env = INTEL_DEVICE_SCALE_FACTOR,1
env = MESA_GL_VERSION_OVERRIDE,4.5
env = MESA_GLSL_VERSION_OVERRIDE,450
EOF
            ;;
        *)
            cat >> "$config_dir/gpu-config-$gpu_type.conf" << 'EOF'
# Unknown GPU - using universal settings only
# No GPU-specific optimizations applied
EOF
            ;;
    esac
    
    # Add universal settings to all configs
    cat >> "$config_dir/gpu-config-$gpu_type.conf" << 'EOF'

# Universal GPU stability settings (safe on all systems)
env = WLR_NO_HARDWARE_CURSORS,1
env = WLR_DRM_NO_ATOMIC,1
env = WLR_RENDERER,vulkan
env = __GL_SYNC_TO_VBLANK,0
env = __GL_THREADED_OPTIMIZATIONS,1
EOF
    
    echo "✅ GPU configuration saved to: $config_dir/gpu-config-$gpu_type.conf"
}

# Main function
main() {
    echo "🔍 Detecting GPU type..."
    
    # Detect GPU
    local gpu_type=$(detect_gpu)
    echo "🎯 GPU detected: $gpu_type"
    
    # Apply universal settings (safe on all systems)
    apply_universal_settings
    
    # Apply GPU-specific settings
    case $gpu_type in
        "nvidia")
            apply_nvidia_settings
            ;;
        "amd")
            apply_amd_settings
            ;;
        "intel")
            apply_intel_settings
            ;;
        *)
            echo "⚠️  Unknown GPU type - applying universal settings only"
            ;;
    esac
    
    # Create GPU-specific config file
    create_gpu_config "$gpu_type"
    
    echo ""
    echo "✅ GPU Auto-Configuration completed!"
    echo "🎯 GPU Type: $gpu_type"
    echo "📁 Config saved to: ~/.config/hypr/gpu-config-$gpu_type.conf"
    echo ""
    echo "💡 To use this configuration:"
    echo "   source ~/.config/hypr/gpu-config-$gpu_type.conf"
    echo "   or add it to your hyprland.conf"
}

# Run the main function
main



