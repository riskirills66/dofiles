//@ pragma UseQApplication
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import Quickshell.Wayland
import Quickshell.Services.SystemTray
import QtQuick
import QtQuick.Layouts
import QtQuick.Effects

ShellRoot {
    id: root
    
    // Rosé Pine colors
    readonly property color baseColor: "#191724"
    readonly property color textColor: "#e0def4"
    readonly property color subtleColor: "#908caa"
    readonly property color mutedColor: "#6e6a86"
    readonly property color foamColor: "#9ccfd8"
    readonly property color irisColor: "#c4a7e7"
    readonly property color pineColor: "#31748f"
    readonly property color goldColor: "#f6c177"
    readonly property color roseColor: "#ebbcba"
    readonly property color loveColor: "#eb6f92"
    
    readonly property int borderThickness: 8
    readonly property int cornerRadius: 16
    readonly property int barHeight: 32
    readonly property int fontSize: 20

    // Exclusion zones to push windows away from the frame
    Variants {
        model: Quickshell.screens

        PanelWindow {
            property var modelData
            screen: modelData
            anchors.top: true
            exclusiveZone: root.barHeight
            implicitHeight: 1
            color: "transparent"
            mask: Region {}
        }
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            property var modelData
            screen: modelData
            anchors.left: true
            exclusiveZone: root.borderThickness
            implicitWidth: 1
            color: "transparent"
            mask: Region {}
        }
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            property var modelData
            screen: modelData
            anchors.right: true
            exclusiveZone: root.borderThickness
            implicitWidth: 1
            color: "transparent"
            mask: Region {}
        }
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            property var modelData
            screen: modelData
            anchors.bottom: true
            exclusiveZone: root.borderThickness
            implicitHeight: 1
            color: "transparent"
            mask: Region {}
        }
    }

    // Main frame window
    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: win
            property var modelData
            screen: modelData

            anchors {
                top: true
                bottom: true
                left: true
                right: true
            }

            color: "transparent"
            WlrLayershell.exclusionMode: ExclusionMode.Ignore

            // Input mask - cut out the inner area so clicks pass through
            mask: Region {
                x: root.borderThickness
                y: root.barHeight
                width: win.width - root.borderThickness * 2
                height: win.height - root.barHeight - root.borderThickness
                intersection: Intersection.Xor
            }

            // Frame container with shadow - shadow is cast by the frame shape
            Item {
                anchors.fill: parent
                layer.enabled: true
                layer.effect: MultiEffect {
                    shadowEnabled: true
                    shadowColor: Qt.rgba(0, 0, 0, 0.8)
                    blurMax: 30
                }

                // Frame with rounded inner corners using mask
                Rectangle {
                    id: frame
                    anchors.fill: parent
                    color: Qt.rgba(25/255, 23/255, 36/255, 0.8)

                    layer.enabled: true
                    layer.effect: MultiEffect {
                        maskSource: innerMask
                        maskEnabled: true
                        maskInverted: true
                        maskThresholdMin: 0.5
                        maskSpreadAtMin: 1
                    }
                }
            }

            // Mask for the inner rounded rectangle (the "hole")
            Item {
                id: innerMask
                anchors.fill: parent
                layer.enabled: true
                visible: false

                Rectangle {
                    anchors.fill: parent
                    anchors.topMargin: root.barHeight
                    anchors.leftMargin: root.borderThickness
                    anchors.rightMargin: root.borderThickness
                    anchors.bottomMargin: root.borderThickness
                    radius: root.cornerRadius
                    color: "white"
                }
            }

            // Top bar content
            Item {
                id: barContent
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                height: root.barHeight

                // Left: Workspaces
                Rectangle {
                    anchors.left: parent.left
                    anchors.leftMargin: 12
                    anchors.verticalCenter: parent.verticalCenter
                    height: 24
                    width: workspacesRow.width + 10
                    radius: 12
                    color: Qt.rgba(255/255, 255/255, 255/255, 0.15)

                    RowLayout {
                        id: workspacesRow
                        anchors.centerIn: parent
                        spacing: 5

                        Repeater {
                            model: Hyprland.workspaces

                            delegate: Item {
                                required property var modelData
                                property bool isActive: Hyprland.focusedMonitor?.activeWorkspace?.id === modelData.id
                                
                                width: 20
                                height: 18

                                Rectangle {
                                    anchors.centerIn: parent
                                    width: 18
                                    height: 16
                                    radius: 8
                                    color: parent.isActive ? root.textColor : "transparent"
                                }

                                Text {
                                    anchors.centerIn: parent
                                    text: modelData.id
                                    color: parent.isActive ? root.baseColor : root.subtleColor
                                    font.family: "JetBrainsMono Nerd Font Mono"
                                    font.pixelSize: 11
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    onClicked: Hyprland.dispatch("workspace " + modelData.id)
                                }
                            }
                        }
                    }
                }

                // Center: Clock (absolutely centered)
                Item {
                    id: clockContainer
                    anchors.centerIn: parent
                    width: clock.width
                    height: clock.height

                    Text {
                        id: clock
                        anchors.centerIn: parent
                        color: root.textColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: 13
                        font.bold: true
                        property string time: ""

                        Process {
                            id: clockProcess
                            command: ["date", "+%A, %H:%M - %d-%m-%Y"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => clock.time = data
                            }
                        }

                        Timer {
                            interval: 1000
                            running: true
                            repeat: true
                            onTriggered: clockProcess.running = true
                        }

                        text: time
                    }

                    MouseArea {
                        anchors.fill: parent
                        hoverEnabled: true
                        onEntered: calendarPopup.visible = true
                        onExited: calendarPopup.visible = false
                    }

                    // Calendar popup on hover
                    Rectangle {
                        id: calendarPopup
                        visible: false
                        anchors.top: parent.bottom
                        anchors.topMargin: 8
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: calendarText.width + 24
                        height: calendarText.height + 16
                        radius: 8
                        color: root.baseColor
                        border.width: 0
                        border.color: root.mutedColor

                        property string calendarOutput: ""

                        Process {
                            id: calendarProcess
                            command: ["cal"]
                            running: true
                            stdout: SplitParser {
                                splitMarker: ""
                                onRead: data => calendarPopup.calendarOutput = data
                            }
                        }

                        Timer {
                            interval: 60000
                            running: true
                            repeat: true
                            onTriggered: calendarProcess.running = true
                        }

                        Text {
                            id: calendarText
                            anchors.centerIn: parent
                            text: calendarPopup.calendarOutput
                            color: root.textColor
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: 11
                            lineHeight: 1.2
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: calendarPopup.visible = true
                            onExited: calendarPopup.visible = false
                        }
                    }
                }

                // Right: System info
                RowLayout {
                    anchors.right: parent.right
                    anchors.rightMargin: 16
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: 0

                    // System Tray
                    RowLayout {
                        spacing: 8

                        Repeater {
                            model: SystemTray.items

                            Item {
                                id: trayItemContainer
                                required property var modelData
                                width: 24
                                height: 24

                                Image {
                                    id: trayIcon
                                    anchors.centerIn: parent
                                    width: 14
                                    height: 14
                                    source: modelData.icon
                                    sourceSize.width: 14
                                    sourceSize.height: 14
                                    fillMode: Image.PreserveAspectFit
                                    visible: false
                                }

                                MultiEffect {
                                    anchors.centerIn: parent
                                    width: 14
                                    height: 14
                                    source: trayIcon
                                    saturation: -1.0
                                    brightness: 0.1
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
                                    cursorShape: Qt.PointingHandCursor
                                    hoverEnabled: true
                                    onClicked: mouse => {
                                        if (modelData.hasMenu) {
                                            var pos = trayItemContainer.mapToItem(null, 0, 0)
                                            modelData.display(win, pos.x, root.barHeight)
                                        } else if (mouse.button === Qt.LeftButton) {
                                            modelData.activate()
                                        } else {
                                            modelData.secondaryActivate()
                                        }
                                    }
                                    onWheel: wheel => {
                                        modelData.scroll(wheel.angleDelta.y / 120, false)
                                    }
                                }
                            }
                        }
                    }

                    Rectangle {
                        width: 1
                        height: 16
                        color: root.mutedColor
                        visible: SystemTray.items.count > 0
                        Layout.leftMargin: 16
                        Layout.rightMargin: 16
                    }

                    Item {
                        id: volumeContainer
                        width: volumeText.width
                        height: root.barHeight

                        property int volumeLevel: 0
                        property bool muted: false

                        Process {
                            id: volumeProcess
                            command: ["sh", "-c", "pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => volumeContainer.volumeLevel = parseInt(data.trim()) || 0
                            }
                        }

                        Process {
                            id: mutedProcess
                            command: ["sh", "-c", "pactl get-sink-mute @DEFAULT_SINK@ | grep -oP 'yes|no'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => volumeContainer.muted = data.trim() === "yes"
                            }
                        }

                        Timer {
                            interval: 2000
                            running: true
                            repeat: true
                            onTriggered: {
                                volumeProcess.running = true
                                mutedProcess.running = true
                            }
                        }

                        // Function to update volume status immediately
                        function updateVolumeStatus() {
                            volumeProcess.running = true
                            mutedProcess.running = true
                        }

                        Text {
                            id: volumeText
                            anchors.centerIn: parent
                            color: root.textColor
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: root.fontSize
                            leftPadding: 8
                            rightPadding: 8

                            text: getVolumeIcon()

                            function getVolumeIcon() {
                                if (volumeContainer.muted || volumeContainer.volumeLevel === 0) return "󰖁"
                                return "󰕾"
                            }
                        }

                        // Process for toggling mute
                        Process {
                            id: toggleMuteProcess
                            command: ["pactl", "set-sink-mute", "@DEFAULT_SINK@", "toggle"]
                        }

                        // Process for volume adjustment
                        Process {
                            id: volumeAdjustProcess
                            property string adjustment: ""
                            command: ["pactl", "set-sink-volume", "@DEFAULT_SINK@", adjustment]
                        }

                        // Timer for quick status updates after user actions
                        Timer {
                            id: quickUpdateTimer
                            interval: 100
                            repeat: false
                            onTriggered: volumeContainer.updateVolumeStatus()
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            acceptedButtons: Qt.LeftButton
                            onEntered: volumePopup.visible = true
                            onExited: volumePopup.visible = false
                            onClicked: {
                                // Toggle mute/unmute
                                toggleMuteProcess.running = true
                                // Update status after a short delay
                                quickUpdateTimer.start()
                            }
                            onWheel: function(wheel) {
                                // Adjust volume with scroll wheel
                                var delta = wheel.angleDelta.y / 120 // Standard wheel step
                                var volumeChange = delta * 5 // 5% per scroll step
                                
                                if (volumeChange > 0) {
                                    // Scroll up - increase volume
                                    volumeAdjustProcess.adjustment = "+" + Math.abs(volumeChange) + "%"
                                    volumeAdjustProcess.running = true
                                } else if (volumeChange < 0) {
                                    // Scroll down - decrease volume
                                    volumeAdjustProcess.adjustment = "-" + Math.abs(volumeChange) + "%"
                                    volumeAdjustProcess.running = true
                                }
                                
                                // Update status after a short delay
                                quickUpdateTimer.start()
                            }
                        }

                        Rectangle {
                            id: volumePopup
                            visible: false
                            anchors.top: parent.bottom
                            anchors.topMargin: 4
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: volumePopupText.width + 16
                            height: volumePopupText.height + 8
                            radius: 6
                            color: root.baseColor
                            border.width: 0
                            border.color: root.mutedColor

                            Text {
                                id: volumePopupText
                                anchors.centerIn: parent
                                text: volumeContainer.muted ? "Muted" : volumeContainer.volumeLevel + "%"
                                color: root.textColor
                                font.family: "JetBrainsMono Nerd Font Mono"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onEntered: volumePopup.visible = true
                                onExited: volumePopup.visible = false
                            }
                        }
                    }

                    Item {
                        id: networkContainer
                        width: networkText.width
                        height: root.barHeight

                        property string network: ""
                        property bool connected: false
                        property string connType: "none"

                        Process {
                            id: networkProcess
                            command: ["sh", "-c", "ip -o link show up | grep -E 'state UP|state UNKNOWN' | grep -vE 'lo:|docker|br-|veth|flannel' | head -1 | awk -F': ' '{print $2}'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => {
                                    var iface = data.trim()
                                    if (iface.length > 0) {
                                        networkContainer.network = iface
                                        networkContainer.connected = true
                                        if (iface.startsWith("wl")) networkContainer.connType = "wifi"
                                        else if (iface.startsWith("en") || iface.startsWith("eth")) networkContainer.connType = "ethernet"
                                        else if (iface.startsWith("tun") || iface.startsWith("tailscale")) networkContainer.connType = "vpn"
                                        else networkContainer.connType = "other"
                                    } else {
                                        networkContainer.connected = false
                                        networkContainer.connType = "none"
                                    }
                                }
                            }
                        }

                        Timer {
                            interval: 5000
                            running: true
                            repeat: true
                            onTriggered: networkProcess.running = true
                        }

                        Text {
                            id: networkText
                            anchors.centerIn: parent
                            color: root.textColor
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: root.fontSize
                            leftPadding: 8
                            rightPadding: 8

                            text: getNetworkIcon()

                            function getNetworkIcon() {
                                if (!networkContainer.connected) return "󰤭"
                                if (networkContainer.connType === "wifi") return "󰤨"
                                if (networkContainer.connType === "ethernet") return "󰈀"
                                if (networkContainer.connType === "vpn") return "󰦝"
                                return "󰛳"
                            }
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: networkPopup.visible = true
                            onExited: networkPopup.visible = false
                        }

                        Rectangle {
                            id: networkPopup
                            visible: false
                            anchors.top: parent.bottom
                            anchors.topMargin: 4
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: networkPopupText.width + 16
                            height: networkPopupText.height + 8
                            radius: 6
                            color: root.baseColor
                            border.width: 0
                            border.color: root.mutedColor

                            Text {
                                id: networkPopupText
                                anchors.centerIn: parent
                                text: networkContainer.connected ? networkContainer.network : "Disconnected"
                                color: root.textColor
                                font.family: "JetBrainsMono Nerd Font Mono"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onEntered: networkPopup.visible = true
                                onExited: networkPopup.visible = false
                            }
                        }
                    }

                    Item {
                        id: cpuContainer
                        width: cpuText.width
                        height: root.barHeight

                        property int cpuLevel: 0

                        Process {
                            id: cpuProcess
                            command: ["sh", "-c", "top -bn1 | grep 'Cpu(s)' | awk '{print int($2)}'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => cpuContainer.cpuLevel = parseInt(data.trim()) || 0
                            }
                        }

                        Timer {
                            interval: 2000
                            running: true
                            repeat: true
                            onTriggered: cpuProcess.running = true
                        }

                        Text {
                            id: cpuText
                            anchors.centerIn: parent
                            color: root.textColor
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: root.fontSize
                            leftPadding: 8
                            rightPadding: 8
                            text: "󰻠"
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: cpuPopup.visible = true
                            onExited: cpuPopup.visible = false
                        }

                        Rectangle {
                            id: cpuPopup
                            visible: false
                            anchors.top: parent.bottom
                            anchors.topMargin: 4
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: cpuPopupText.width + 16
                            height: cpuPopupText.height + 8
                            radius: 6
                            color: root.baseColor
                            border.width: 0
                            border.color: root.mutedColor

                            Text {
                                id: cpuPopupText
                                anchors.centerIn: parent
                                text: cpuContainer.cpuLevel + "%"
                                color: root.textColor
                                font.family: "JetBrainsMono Nerd Font Mono"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onEntered: cpuPopup.visible = true
                                onExited: cpuPopup.visible = false
                            }
                        }
                    }

                    Item {
                        id: memContainer
                        width: memText.width
                        height: root.barHeight

                        property int memLevel: 0

                        Process {
                            id: memProcess
                            command: ["sh", "-c", "free | awk '/Mem:/ {printf \"%.0f\", $3/$2 * 100}'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => memContainer.memLevel = parseInt(data.trim()) || 0
                            }
                        }

                        Timer {
                            interval: 2000
                            running: true
                            repeat: true
                            onTriggered: memProcess.running = true
                        }

                        Text {
                            id: memText
                            anchors.centerIn: parent
                            color: root.textColor
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: root.fontSize
                            leftPadding: 8
                            rightPadding: 8
                            text: "󰍛"
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: memPopup.visible = true
                            onExited: memPopup.visible = false
                        }

                        Rectangle {
                            id: memPopup
                            visible: false
                            anchors.top: parent.bottom
                            anchors.topMargin: 4
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: memPopupText.width + 16
                            height: memPopupText.height + 8
                            radius: 6
                            color: root.baseColor
                            border.width: 0
                            border.color: root.mutedColor

                            Text {
                                id: memPopupText
                                anchors.centerIn: parent
                                text: memContainer.memLevel + "%"
                                color: root.textColor
                                font.family: "JetBrainsMono Nerd Font Mono"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onEntered: memPopup.visible = true
                                onExited: memPopup.visible = false
                            }
                        }
                    }

                    Item {
                        id: batteryContainer
                        width: batteryText.width
                        height: root.barHeight
                        visible: hasBattery

                        property int batteryLevel: 0
                        property bool charging: false
                        property bool hasBattery: false

                        Process {
                            id: batteryProcess
                            command: ["sh", "-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => {
                                    batteryContainer.batteryLevel = parseInt(data.trim()) || 0
                                    batteryContainer.hasBattery = data.trim().length > 0
                                }
                            }
                        }

                        Process {
                            id: chargingProcess
                            command: ["sh", "-c", "cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => batteryContainer.charging = data.trim() === "Charging"
                            }
                        }

                        Timer {
                            interval: 10000
                            running: true
                            repeat: true
                            onTriggered: {
                                batteryProcess.running = true
                                chargingProcess.running = true
                            }
                        }

                        Text {
                            id: batteryText
                            anchors.centerIn: parent
                            color: getBatteryColor()
                            font.family: "JetBrainsMono Nerd Font Mono"
                            font.pixelSize: 13
                            leftPadding: 8
                            rightPadding: 8

                            text: batteryContainer.batteryLevel + "%" + (batteryContainer.charging ? " " : "")

                            function getBatteryColor() {
                                if (batteryContainer.charging) return root.foamColor
                                if (batteryContainer.batteryLevel < 20) return root.loveColor
                                return root.textColor
                            }
                        }

                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: batteryPopup.visible = true
                            onExited: batteryPopup.visible = false
                        }

                        Rectangle {
                            id: batteryPopup
                            visible: false
                            anchors.top: parent.bottom
                            anchors.topMargin: 4
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: batteryPopupText.width + 16
                            height: batteryPopupText.height + 8
                            radius: 6
                            color: root.baseColor
                            border.width: 0
                            border.color: root.mutedColor

                            Text {
                                id: batteryPopupText
                                anchors.centerIn: parent
                                text: batteryContainer.batteryLevel + "%" + (batteryContainer.charging ? " ⚡" : "")
                                color: root.textColor
                                font.family: "JetBrainsMono Nerd Font Mono"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                anchors.fill: parent
                                hoverEnabled: true
                                onEntered: batteryPopup.visible = true
                                onExited: batteryPopup.visible = false
                            }
                        }
                    }
                }
            }
        }
    }

    // Volume OSD Window
    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: volumeOSD
            property var modelData
            screen: modelData
            
            anchors {
                top: true
            }
            
            margins {
                top: 100
            }
            
            width: 300
            height: 80
            color: "transparent"
            visible: false
            
            WlrLayershell.exclusionMode: ExclusionMode.Ignore
            WlrLayershell.layer: Layer.Overlay

            property int osdVolume: 0
            property bool osdMuted: false
            property alias osdVisible: volumeOSD.visible

            // Auto-hide timer
            Timer {
                id: osdTimer
                interval: 2000
                repeat: false
                onTriggered: volumeOSD.visible = false
            }

            // Monitor volume changes from media keys
            Process {
                id: volumeMonitor
                command: ["sh", "-c", "pactl subscribe | grep --line-buffered -E \"Event 'change' on sink.*#[0-9]+\""]
                running: true
                stdout: SplitParser {
                    onRead: {
                        // Only update OSD if volume or mute actually changed
                        checkVolumeChange()
                    }
                }
            }

            property int lastVolume: 0
            property bool lastMuted: false

            function checkVolumeChange() {
                // Get current volume and mute status
                var volumeCmd = Qt.createQmlObject('
                    import Quickshell.Io
                    Process {
                        command: ["sh", "-c", "pactl get-sink-volume @DEFAULT_SINK@ | grep -oP \'\\\\d+%\' | head -1"]
                        running: true
                        stdout: SplitParser {
                            onRead: data => {
                                var currentVolume = parseInt(data.trim()) || 0
                                if (currentVolume !== volumeOSD.lastVolume) {
                                    volumeOSD.lastVolume = currentVolume
                                    volumeOSD.osdVolume = currentVolume
                                    volumeOSD.showOSD()
                                }
                            }
                        }
                    }
                ', volumeOSD)
                
                var muteCmd = Qt.createQmlObject('
                    import Quickshell.Io
                    Process {
                        command: ["sh", "-c", "pactl get-sink-mute @DEFAULT_SINK@ | grep -oP \'yes|no\'"]
                        running: true
                        stdout: SplitParser {
                            onRead: data => {
                                var currentMuted = data.trim() === "yes"
                                if (currentMuted !== volumeOSD.lastMuted) {
                                    volumeOSD.lastMuted = currentMuted
                                    volumeOSD.osdMuted = currentMuted
                                    volumeOSD.showOSD()
                                }
                            }
                        }
                    }
                ', volumeOSD)
            }

            function showOSD() {
                volumeOSD.visible = true
                osdTimer.restart()
            }

            Rectangle {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.top: parent.top
                width: 280
                height: 60
                radius: 12
                color: Qt.rgba(25/255, 23/255, 36/255, 0.95)
                border.width: 1
                border.color: root.mutedColor
                clip: true

                // Drop shadow effect
                layer.enabled: true
                layer.effect: MultiEffect {
                    shadowEnabled: true
                    shadowColor: Qt.rgba(0, 0, 0, 0.6)
                    blurMax: 20
                }

                Row {
                    anchors.centerIn: parent
                    anchors.margins: 12
                    spacing: 12

                    // Volume icon
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        color: volumeOSD.osdMuted ? root.mutedColor : root.textColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: 20
                        text: volumeOSD.osdMuted ? "󰖁" : (volumeOSD.osdVolume === 0 ? "󰖁" : "󰕾")
                    }

                    // Volume bar background
                    Rectangle {
                        anchors.verticalCenter: parent.verticalCenter
                        width: 160
                        height: 6
                        radius: 3
                        color: root.mutedColor

                        // Volume bar fill
                        Rectangle {
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            width: volumeOSD.osdMuted ? 0 : (parent.width * volumeOSD.osdVolume / 100)
                            height: parent.height
                            radius: 3
                            color: volumeOSD.osdVolume > 80 ? root.loveColor : 
                                   volumeOSD.osdVolume > 50 ? root.goldColor : root.foamColor
                            
                            Behavior on width {
                                NumberAnimation { duration: 150 }
                            }
                        }
                    }

                    // Volume percentage
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        color: root.textColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: 14
                        font.bold: true
                        text: volumeOSD.osdMuted ? "MUTED" : volumeOSD.osdVolume + "%"
                    }
                }
            }
        }
    }

    // Brightness OSD Window
    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: brightnessOSD
            property var modelData
            screen: modelData
            
            anchors {
                top: true
            }
            
            margins {
                top: 180
            }
            
            width: 300
            height: 80
            color: "transparent"
            visible: false
            
            WlrLayershell.exclusionMode: ExclusionMode.Ignore
            WlrLayershell.layer: Layer.Overlay

            property int osdBrightness: 0
            property alias osdVisible: brightnessOSD.visible

            // Auto-hide timer
            Timer {
                id: brightnessOsdTimer
                interval: 2000
                repeat: false
                onTriggered: brightnessOSD.visible = false
            }

            // Monitor brightness changes
            Process {
                id: brightnessMonitor
                command: ["sh", "-c", "inotifywait -m -e modify /sys/class/backlight/*/brightness 2>/dev/null"]
                running: true
                stdout: SplitParser {
                    onRead: {
                        // Brightness changed, check if it actually changed
                        checkBrightnessChange()
                    }
                }
            }

            property int lastBrightness: -1

            function checkBrightnessChange() {
                // Get current brightness percentage
                var brightnessCmd = Qt.createQmlObject('
                    import Quickshell.Io
                    Process {
                        command: ["sh", "-c", "brightnessctl get; brightnessctl max"]
                        running: true
                        stdout: SplitParser {
                            onRead: data => {
                                var lines = data.trim().split("\\n")
                                if (lines.length >= 2) {
                                    var current = parseInt(lines[0]) || 0
                                    var max = parseInt(lines[1]) || 1
                                    var percentage = Math.round((current / max) * 100)
                                    
                                    if (percentage !== brightnessOSD.lastBrightness) {
                                        brightnessOSD.lastBrightness = percentage
                                        brightnessOSD.osdBrightness = percentage
                                        brightnessOSD.showOSD()
                                    }
                                }
                            }
                        }
                    }
                ', brightnessOSD)
            }

            function showOSD() {
                brightnessOSD.visible = true
                brightnessOsdTimer.restart()
            }

            Rectangle {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.top: parent.top
                width: 280
                height: 60
                radius: 12
                color: Qt.rgba(25/255, 23/255, 36/255, 0.95)
                border.width: 1
                border.color: root.mutedColor
                clip: true

                // Drop shadow effect
                layer.enabled: true
                layer.effect: MultiEffect {
                    shadowEnabled: true
                    shadowColor: Qt.rgba(0, 0, 0, 0.6)
                    blurMax: 20
                }

                Row {
                    anchors.centerIn: parent
                    anchors.margins: 12
                    spacing: 12

                    // Brightness icon
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        color: root.textColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: 20
                        text: brightnessOSD.osdBrightness === 0 ? "󰃞" : "󰃠"
                    }

                    // Brightness bar background
                    Rectangle {
                        anchors.verticalCenter: parent.verticalCenter
                        width: 160
                        height: 6
                        radius: 3
                        color: root.mutedColor

                        // Brightness bar fill
                        Rectangle {
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            width: parent.width * brightnessOSD.osdBrightness / 100
                            height: parent.height
                            radius: 3
                            color: brightnessOSD.osdBrightness > 80 ? root.goldColor : 
                                   brightnessOSD.osdBrightness > 50 ? root.foamColor : root.irisColor
                            
                            Behavior on width {
                                NumberAnimation { duration: 150 }
                            }
                        }
                    }

                    // Brightness percentage
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        color: root.textColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: 14
                        font.bold: true
                        text: brightnessOSD.osdBrightness + "%"
                    }
                }
            }
        }
    }
}
