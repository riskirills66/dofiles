import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import Quickshell.Wayland
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
    readonly property int fontSize: 13

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

            // Frame with rounded inner corners using mask
            Rectangle {
                id: frame
                anchors.fill: parent
                color: Qt.rgba(25/255, 23/255, 36/255, 0.7)

                layer.enabled: true
                layer.effect: MultiEffect {
                    maskSource: innerMask
                    maskEnabled: true
                    maskInverted: true
                    maskThresholdMin: 0.5
                    maskSpreadAtMin: 1
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

            // Inner border (1px) with centered drop shadow
            Rectangle {
                anchors.fill: parent
                anchors.topMargin: root.barHeight - 1
                anchors.leftMargin: root.borderThickness - 1
                anchors.rightMargin: root.borderThickness - 1
                anchors.bottomMargin: root.borderThickness - 1
                radius: root.cornerRadius
                color: "transparent"
                border.width: 1
                border.color: "#6E6A86"

                layer.enabled: true
                layer.effect: MultiEffect {
                    shadowEnabled: true
                    shadowColor: Qt.rgba(0, 0, 0, 0.5)
                    shadowBlur: 0.8
                    shadowHorizontalOffset: 0
                    shadowVerticalOffset: 0
                    shadowScale: 1.02
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
                    color: Qt.rgba(255/255, 255/255, 255/255, 0.1)

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
                Text {
                    id: clock
                    anchors.centerIn: parent
                    color: root.textColor
                    font.family: "JetBrainsMono Nerd Font Mono"
                    font.pixelSize: root.fontSize
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

                // Right: System info
                RowLayout {
                    anchors.right: parent.right
                    anchors.rightMargin: 16
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: 0

                    Text {
                        id: volumeText
                        color: root.goldColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: root.fontSize
                        leftPadding: 8
                        rightPadding: 8
                        verticalAlignment: Text.AlignVCenter
                        height: root.barHeight
                        property string volume: ""
                        property bool muted: false

                        Process {
                            id: volumeProcess
                            command: ["sh", "-c", "pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => volumeText.volume = data.trim()
                            }
                        }

                        Process {
                            id: mutedProcess
                            command: ["sh", "-c", "pactl get-sink-mute @DEFAULT_SINK@ | grep -oP 'yes|no'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => volumeText.muted = data.trim() === "yes"
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

                        text: (muted ? "󰝟 " : "󰕾 ") + volume
                    }

                    Text {
                        id: networkText
                        color: root.pineColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: root.fontSize
                        leftPadding: 8
                        rightPadding: 8
                        verticalAlignment: Text.AlignVCenter
                        height: root.barHeight
                        property string network: ""
                        property bool connected: false

                        Process {
                            id: networkProcess
                            command: ["sh", "-c", "nmcli -t -f active,ssid dev wifi 2>/dev/null | grep '^yes' | cut -d: -f2 || nmcli -t -f TYPE,STATE dev | grep -q 'ethernet:connected' && echo 'Ethernet'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => {
                                    networkText.network = data.trim()
                                    networkText.connected = data.trim().length > 0
                                }
                            }
                        }

                        Timer {
                            interval: 5000
                            running: true
                            repeat: true
                            onTriggered: networkProcess.running = true
                        }

                        text: connected ? "󰤨 " + network : "󰤭 "
                    }

                    Text {
                        id: cpuText
                        color: root.foamColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: root.fontSize
                        leftPadding: 8
                        rightPadding: 8
                        verticalAlignment: Text.AlignVCenter
                        height: root.barHeight
                        property string cpu: ""

                        Process {
                            id: cpuProcess
                            command: ["sh", "-c", "top -bn1 | grep 'Cpu(s)' | awk '{print int($2)}'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => cpuText.cpu = data.trim()
                            }
                        }

                        Timer {
                            interval: 2000
                            running: true
                            repeat: true
                            onTriggered: cpuProcess.running = true
                        }

                        text: " " + cpu + "%"
                    }

                    Text {
                        id: memText
                        color: root.irisColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: root.fontSize
                        leftPadding: 8
                        rightPadding: 8
                        verticalAlignment: Text.AlignVCenter
                        height: root.barHeight
                        property string mem: ""

                        Process {
                            id: memProcess
                            command: ["sh", "-c", "free | awk '/Mem:/ {printf \"%.0f\", $3/$2 * 100}'"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => memText.mem = data.trim()
                            }
                        }

                        Timer {
                            interval: 2000
                            running: true
                            repeat: true
                            onTriggered: memProcess.running = true
                        }

                        text: "󰍛 " + mem + "%"
                    }

                    Text {
                        id: batteryText
                        color: root.roseColor
                        font.family: "JetBrainsMono Nerd Font Mono"
                        font.pixelSize: root.fontSize
                        leftPadding: 8
                        rightPadding: 8
                        verticalAlignment: Text.AlignVCenter
                        height: root.barHeight
                        visible: hasBattery
                        property string battery: ""
                        property bool charging: false
                        property bool hasBattery: false

                        Process {
                            id: batteryProcess
                            command: ["sh", "-c", "cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => {
                                    batteryText.battery = data.trim()
                                    batteryText.hasBattery = data.trim().length > 0
                                }
                            }
                        }

                        Process {
                            id: chargingProcess
                            command: ["sh", "-c", "cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1"]
                            running: true
                            stdout: SplitParser {
                                onRead: data => batteryText.charging = data.trim() === "Charging"
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

                        text: (charging ? "󰂄 " : getBatteryIcon(parseInt(battery) || 0) + " ") + battery + "%"

                        function getBatteryIcon(level) {
                            if (level >= 95) return "󰁹"
                            if (level >= 85) return "󰂂"
                            if (level >= 75) return "󰂁"
                            if (level >= 65) return "󰂀"
                            if (level >= 55) return "󰁿"
                            if (level >= 45) return "󰁾"
                            if (level >= 35) return "󰁽"
                            if (level >= 25) return "󰁼"
                            if (level >= 15) return "󰁻"
                            return "󰁺"
                        }
                    }
                }
            }
        }
    }
}
