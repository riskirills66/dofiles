#!/bin/bash

export PATH="$HOME/.local/bin:$PATH"

output_dir="$HOME/Pictures/Screenshots"
mkdir -p "$output_dir"

timestamp=$(date +"%Y%m%d_%H%M%S")
filename="ocr_${timestamp}.png"
filepath="$output_dir/$filename"

monitor=$(slurp -o)
if [ $? -ne 0 ] || [ -z "$monitor" ]; then
	exit 0
fi

sleep 0.1

grim -g "$monitor" "$filepath"
if [ $? -ne 0 ]; then
	notify-send "OCR failed" "Failed to capture screenshot"
	exit 1
fi

height=$(magick identify -format "%h" "$filepath" 2>/dev/null)
[ -n "$height" ] && [ "$height" -lt 256 ] && magick "$filepath" -resize -x256 "$filepath" 2>/dev/null

api_key=$(cat ~/.ocrapikey)
if [ -z "$api_key" ]; then
	notify-send "OCR failed" "API key not found in ~/.ocrapikey"
	rm "$filepath"
	exit 1
fi

response=$(curl -s -X POST "https://api.ocr.space/parse/image" \
	-F "apikey=$api_key" \
	-F "file=@$filepath")

parsed_text=$(echo "$response" | jq -r '.ParsedResults[0].ParsedText' 2>/dev/null)

if [ -z "$parsed_text" ] || [ "$parsed_text" = "null" ]; then
	error_msg=$(echo "$response" | jq -r '.ErrorMessage[0]' 2>/dev/null)
	notify-send "OCR failed" "${error_msg:-Failed to parse image}"
	rm "$filepath"
	exit 1
fi

echo -n "$parsed_text" | wl-copy
rm "$filepath"

notify-send "OCR Complete" "Text copied to clipboard"
