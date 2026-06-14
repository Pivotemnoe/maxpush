#!/usr/bin/env bash
set -euo pipefail
SRC="apps/android/app/build/outputs/apk/debug/app-debug.apk"
DST="apps/web/public/download/max-push-latest.apk"
if [ ! -f "$SRC" ]; then
  echo "APK не найден: $SRC" >&2
  echo "Сначала соберите Android: cd apps/android && ./gradlew assembleDebug" >&2
  exit 1
fi
mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "APK скопирован в $DST"
