#!/usr/bin/env bash

WS_ID="$1"

if [ -z "$WS_ID" ]; then
  echo "Usage: toggle_ws.sh <workspace_id>" >&2
  exit 1
fi

# Monitor that is currently focused (before we do anything)
ORIG_MONITOR=$(
  hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
)

if [ -z "$ORIG_MONITOR" ]; then
  echo "Could not determine focused monitor" >&2
  exit 1
fi

# Which monitor currently holds this workspace (if it exists)
WS_MONITOR=$(
  hyprctl workspaces -j | jq -r ".[] | select(.id == ${WS_ID}) | .monitor"
)

# Currently active workspace ID (global)
ACTIVE_WS_ID=$(
  hyprctl activeworkspace -j | jq -r '.id'
)

# "Other" monitor (first monitor that is not the original)
OTHER_MONITOR=$(
  hyprctl monitors -j | jq -r ".[] | select(.name != \"${ORIG_MONITOR}\") | .name" | head -n 1
)

# --- Logic ---

if [ -z "$WS_MONITOR" ]; then
  # Workspace doesn't exist yet -> spawn/move it to current monitor and focus it
  hyprctl dispatch moveworkspacetomonitor "${WS_ID} ${ORIG_MONITOR}"
  hyprctl dispatch workspace "${WS_ID}"
  exit 0
fi

if [ "$WS_MONITOR" != "$ORIG_MONITOR" ]; then
  # Workspace is on another monitor -> bring it here and focus it
  hyprctl dispatch moveworkspacetomonitor "${WS_ID} ${ORIG_MONITOR}"
  hyprctl dispatch workspace "${WS_ID}"
  exit 0
fi

# At this point: workspace is on the current monitor

if [ "$ACTIVE_WS_ID" != "$WS_ID" ]; then
  # It's here but not active -> just focus it, don't move it away
  hyprctl dispatch workspace "${WS_ID}"
  exit 0
fi

# Here: workspace is on this monitor AND is active.
# => send it to the other monitor, but keep focus on this monitor.

if [ -n "$OTHER_MONITOR" ]; then
  hyprctl dispatch moveworkspacetomonitor "${WS_ID} ${OTHER_MONITOR}"

  # moveworkspacetomonitor will try to drag focus along,
  # so we immediately push focus back to the original monitor.
  hyprctl dispatch focusmonitor "${ORIG_MONITOR}"
fi
