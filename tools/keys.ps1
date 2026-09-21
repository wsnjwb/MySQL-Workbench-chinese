# Send keystrokes to the MySQL Workbench window.
param([Parameter(Mandatory = $true)][string]$Keys)
Add-Type -AssemblyName System.Windows.Forms
$proc = Get-Process -Name "MySQL Workbench" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Output "NO_WINDOW"; exit 1 }
$null = (New-Object -ComObject WScript.Shell).AppActivate($proc.Id)
Start-Sleep -Milliseconds 700
[System.Windows.Forms.SendKeys]::SendWait($Keys)
Write-Output "SENT $Keys"
