#!/bin/sh
# hermes-slim installer: curl -fsSL https://hermes-slim.com/install.sh | sh
#
# Fetches the real installer from github.com/talos-hq/hermes-slim (main) and runs it
# with your arguments, so this short URL never drifts from the source of truth:
#   https://github.com/talos-hq/hermes-slim/blob/main/slim/install.sh
# It picks the right bundle for this machine (macOS arm64/x64, Linux x64/arm64/musl).
#
# Everything sits in main() so a piped `sh` has read the whole file before the
# installer runs and can never read the rest of this script as its input.
main() {
  set -eu
  url="https://raw.githubusercontent.com/talos-hq/hermes-slim/main/slim/install.sh"
  tmp="$(mktemp "${TMPDIR:-/tmp}/hermes-slim-install.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 "$url" -o "$tmp"
  else
    wget -qO "$tmp" "$url"
  fi
  sh "$tmp" "$@"
}
main "$@"
