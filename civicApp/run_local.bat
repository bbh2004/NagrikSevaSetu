@echo off
:: run_local.bat
:: ─────────────────────────────────────────────────────────────
:: Automatically detects active local IPv4 address (Wi-Fi or Hotspot)
:: and starts the Flutter app targeting the local backend.
:: ─────────────────────────────────────────────────────────────

echo [NagrikSevaSetu] Detecting active local network IP...

:: Execute a PowerShell script inline to find the most suitable active IP address:
:: 1. Checks for Wi-Fi interfaces (covers connecting to phone hotspot or home Wi-Fi)
:: 2. Falls back to the interface with the default internet gateway
:: 3. Falls back to any active non-loopback IPv4 address
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command ^
    "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and ($_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*Wireless*') } | Select-Object -First 1 -ExpandProperty IPAddress);" ^
    "if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex (Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty InterfaceIndex) -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty IPAddress) };" ^
    "if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) };" ^
    "if ($ip) { Write-Output $ip } else { Write-Output '10.0.2.2' }"`) do (
    set LOCAL_IP=%%i
)

echo [NagrikSevaSetu] Target Backend IP detected: %LOCAL_IP%
echo [NagrikSevaSetu] Backend endpoint URL:       http://%LOCAL_IP%:5000
echo [NagrikSevaSetu] Executing: flutter run --dart-define=API_URL=http://%LOCAL_IP%:5000 --dart-define=ENV=dev
echo.

flutter run --dart-define=API_URL=http://%LOCAL_IP%:5000 --dart-define=ENV=dev
