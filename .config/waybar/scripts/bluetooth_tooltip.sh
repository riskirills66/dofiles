#!/bin/bash

case "$1" in
    toggle)
        # Toggle Bluetooth on/off and send a notification
        if bluetoothctl show | grep -q "Powered: yes"; then
            bluetoothctl power off
            notify-send "Bluetooth" "Bluetooth turned off" --icon=bluetooth
            echo ""  # Display Bluetooth icon when turned off (same icon as when on)
            exit
        else
            bluetoothctl power on
            notify-send "Bluetooth" "Bluetooth turned on" --icon=bluetooth
            echo ""  # Display Bluetooth icon when turned on (same icon as when off)
            exit
        fi
        ;;
    *)
        # Check if Bluetooth is on or off and display the same icon
        if bluetoothctl show | grep -q "Powered: yes"; then
            echo ""  # Display the same icon when Bluetooth is on
        else
            echo ""  # Display the same icon when Bluetooth is off
        fi
        ;;
esac
