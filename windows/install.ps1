# hermes-slim installer: irm https://hermes-slim.com/windows/install.ps1 | iex
#
# Fetches the real installer from github.com/talos-hq/hermes-slim (main) and runs it
# in a child PowerShell, so this short URL never drifts from the source of truth and
# the installer's own `exit` cannot close your window:
#   https://github.com/talos-hq/hermes-slim/blob/main/slim/install.ps1
& {
    $ErrorActionPreference = "Stop"
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $url = "https://raw.githubusercontent.com/talos-hq/hermes-slim/main/slim/install.ps1"
    $script = Join-Path ([IO.Path]::GetTempPath()) "hermes-slim-install.ps1"
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $script
    $shell = (Get-Process -Id $PID).Path
    & $shell -NoProfile -ExecutionPolicy Bypass -File $script @args
    if ($LASTEXITCODE) { Write-Host "hermes-slim: installer exited with code $LASTEXITCODE" -ForegroundColor Red }
} @args
