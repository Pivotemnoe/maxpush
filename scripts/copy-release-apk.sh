#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_APK="$ROOT_DIR/apps/android/app/build/outputs/apk/release/app-release.apk"
TARGET_APK="$ROOT_DIR/apps/web/public/download/max-push-latest.apk"

if [[ ! -f "$SOURCE_APK" ]]; then
  echo "Release APK not found: $SOURCE_APK" >&2
  echo "Run: cd apps/android && ./gradlew assembleRelease" >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET_APK")"
cp "$SOURCE_APK" "$TARGET_APK"
echo "Copied release APK to $TARGET_APK"
