#!/bin/bash

# Sync screenshots from Playwright previews to landing page public directory

SOURCE_DIR="playwright/previews"
TARGET_DIR="pages/public"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "⚠️  Source directory $SOURCE_DIR not found. Run Playwright tests first."
    exit 1
fi

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "⚠️  Target directory $TARGET_DIR not found."
    exit 1
fi

# Copy VRChatAlbums screenshots
echo "🔄 Syncing landing page screenshots..."
cp -f "$SOURCE_DIR"/VRChatAlbums-*.png "$TARGET_DIR/" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Landing page screenshots updated from Playwright previews"
    ls -la "$TARGET_DIR"/VRChatAlbums-*.png | awk '{print "   📸 " $9}'
else
    echo "⚠️  No VRChatAlbums-*.png files found in $SOURCE_DIR"
    exit 1
fi