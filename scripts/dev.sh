#!/bin/bash
eval `dbus-launch --sh-syntax` && concurrently "nr dev:vite" "nr dev:electron"