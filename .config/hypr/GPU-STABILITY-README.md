# Hyprland GPU Stability Configuration

This configuration helps prevent GPU flickering crashes in Hyprland on Arch Linux.

## What This Fixes

- **AMD RX 6700 Series Specific Issues:**
  - GCVM_L2_PROTECTION_FAULT errors
  - GPU memory page faults
  - Graphics ring timeouts
  - AMDGPU driver memory management issues
  
- **General GPU Issues:**
  - GPU flickering that leads to system freezes
  - Crashes to TTY during GPU issues
  - Unstable graphics rendering
  - Monitor flickering and artifacts

- **Hyprland Initialization Crashes:**
  - C++ exception crashes during server startup
  - Signal 6 (ABRT) crashes
  - Server initialization failures
  - Dependency and service conflicts

## Configuration Files Added

### 1. hyprland.conf Updates
- **Environment Variables**: GPU acceleration and stability settings
- **Misc Settings**: Reduced GPU load and crash prevention (valid Hyprland settings)
- **Keybinding**: `SUPER + CTRL + R` for emergency GPU recovery

### 2. gpu-recovery.sh
- Automatic GPU state reset
- Hyprland restart functionality
- GPU error detection and recovery

### 3. gpu-kernel-params.conf
- Kernel parameters for GPU stability
- Power management optimization
- DRM and PCIe stability settings

## How to Use

### Automatic Protection (Recommended)
The GPU protection system now runs **automatically** when you start your system:
- **Auto-starts** when Hyprland launches
- **Continuous monitoring** every 30 seconds
- **Automatic recovery** from GPU issues
- **No user intervention required**

### Manual Controls (Optional)
- **`SUPER + CTRL + A`** - Start auto-recovery service manually
- **`SUPER + CTRL + R`** - Emergency GPU recovery
- **`SUPER + CTRL + Q`** - Quick status check
- **`SUPER + CTRL + D`** - Detailed auto-recovery status

### Kernel Parameters (Optional)
For persistent stability, add these to your bootloader:

**GRUB**: Edit `/etc/default/grub` and add to `GRUB_CMDLINE_LINUX_DEFAULT`
**systemd-boot**: Create a new boot entry with these parameters

### Monitor Refresh Rate
Your current setup uses:
- DP-2: 165Hz (high refresh rate - potential source of issues)
- HDMI-A-1: 60Hz

Consider reducing DP-2 to 144Hz or 120Hz if issues persist.

## Environment Variables Explained

- `WLR_NO_HARDWARE_CURSORS=1`: Disables hardware cursor acceleration
- `WLR_DRM_NO_ATOMIC=1`: Uses legacy DRM mode (more stable)
- `WLR_RENDERER=vulkan`: Forces Vulkan renderer for better stability
- `__GL_SYNC_TO_VBLANK=0`: Disables V-sync for better performance
- `__GL_THREADED_OPTIMIZATIONS=1`: Enables threaded OpenGL operations

## Valid Hyprland Misc Settings

- `disable_autoreload = true`: Prevents automatic configuration reloading (reduces GPU load)
- `force_default_wallpaper = -1`: Disables default wallpapers
- `disable_hyprland_logo = false`: Keeps Hyprland logo (can be set to true to disable)

## GPU-Specific Settings

### NVIDIA
- `__NV_PRIME_RENDER_OFFLOAD=1`: Optimizes GPU rendering
- `__GLX_VENDOR_LIBRARY_NAME=nvidia`: Forces NVIDIA driver usage

### AMD
- `MESA_GL_VERSION_OVERRIDE=4.5`: Sets OpenGL version
- `MESA_GLSL_VERSION_OVERRIDE=450`: Sets GLSL version

### Intel
- `INTEL_DEVICE_SCALE_FACTOR=1`: Optimizes scaling

## Troubleshooting

### If Issues Persist
1. Check GPU drivers: `lspci -k | grep -A 2 -i vga`
2. Monitor system logs: `journalctl -f -g "gpu\|drm\|nvidia\|amd"`
3. Test with different refresh rates
4. Consider updating GPU drivers

### AMD RX 6700 Series Specific
1. **Monitor AMD GPU errors**: `journalctl -f -g "amdgpu.*fault\|amdgpu.*error"`
2. **Check GPU memory**: `cat /sys/class/drm/card0/device/mem_info_vram_total`
3. **Reset GPU state**: `echo 1 > /sys/class/drm/card0/device/reset_engine`
4. **Power management**: `cat /sys/class/drm/card0/device/power_dpm_force_performance_level`

### Common Commands
```bash
# Check GPU status
nvidia-smi  # NVIDIA
radeontop   # AMD
intel_gpu_top  # Intel

# Reset GPU state
echo "reset" > /dev/dri/card0

# Check DRM devices
ls -la /dev/dri/
```

## Safety Features

- **Auto-restart**: System automatically recovers from crashes
- **GPU reset**: Clears GPU memory and state
- **Error detection**: Monitors system logs for GPU issues
- **Graceful degradation**: Falls back to stable settings

## Performance Impact

These settings may slightly reduce performance but significantly improve stability:
- Reduced GPU acceleration features
- Disabled some hardware optimizations
- More conservative power management

## Support

If you continue experiencing issues:
1. Check your specific GPU model compatibility
2. Verify kernel and driver versions
3. Consider using a different compositor temporarily
4. Report issues to Hyprland GitHub with system specs

## Files Created
- `hyprland.conf` (updated)
- `gpu-recovery.sh`
- `gpu-kernel-params.conf`
- `GPU-STABILITY-README.md`

Remember to restart Hyprland after making these changes: `pkill Hyprland && Hyprland`
