# Click inside the MySQL Workbench window at window-relative coordinates.
param(
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinClick {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$proc = Get-Process -Name "MySQL Workbench" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Output "NO_WINDOW"; exit 1 }

[WinClick]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 500

$rect = New-Object WinClick+RECT
[WinClick]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null

$sx = $rect.Left + $X
$sy = $rect.Top + $Y
[WinClick]::SetCursorPos($sx, $sy) | Out-Null
Start-Sleep -Milliseconds 250
[WinClick]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)   # left down
Start-Sleep -Milliseconds 80
[WinClick]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)   # left up
Write-Output "CLICKED $sx,$sy"
