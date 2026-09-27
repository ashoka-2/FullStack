import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execPromise = util.promisify(exec);

/**
 * Execute a secure PowerShell command and return structured JSON
 */
async function runPowerShell(script, timeoutMs = 8000) {
    try {
        // Encode in Base64 UTF-16LE to prevent quote-escaping syntax issues
        const buffer = Buffer.from(script, 'utf16le');
        const encoded = buffer.toString('base64');
        const command = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
        
        const { stdout, stderr } = await execPromise(command, {
            timeout: timeoutMs,
            maxBuffer: 10 * 1024 * 1024,
            windowsHide: true
        });

        if (stderr && stderr.trim().length > 0) {
            console.warn("⚠️ PowerShell Stderr Warning:", stderr.trim());
        }

        const trimmed = (stdout || '').trim();
        if (!trimmed) return null;

        try {
            return JSON.parse(trimmed);
        } catch {
            return trimmed;
        }
    } catch (err) {
        throw new Error(`Windows Automation Error: ${err.message}`);
    }
}

export const desktopWindowsService = {
    // ── 1. App & Window Management ──────────────────────────────────────────
    async listProcesses(limit = 40) {
        const script = `
            Get-Process | Where-Object { $_.MainWindowTitle -ne "" -or $_.WorkingSet -gt 50MB } | 
            Sort-Object -Property CPU -Descending | 
            Select-Object -First ${limit} Id, ProcessName, MainWindowTitle, @{Name="MemoryMB"; Expression={[math]::Round($_.WorkingSet / 1MB, 1)}}, @{Name="Responding"; Expression={$_.Responding}} | 
            ConvertTo-Json -Compress
        `;
        const res = await runPowerShell(script);
        return Array.isArray(res) ? res : (res ? [res] : []);
    },

    async launchApp(appOrPath, args = "") {
        const script = `
            $p = Start-Process -FilePath "${appOrPath}" ${args ? `-ArgumentList '${args}'` : ''} -PassThru
            [PSCustomObject]@{
                launched = $true
                processId = $p.Id
                processName = $p.ProcessName
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async closeProcess(processIdOrName, force = false) {
        const script = typeof processIdOrName === 'number'
            ? `Stop-Process -Id ${processIdOrName} ${force ? '-Force' : ''}; [PSCustomObject]@{ closed = $true; target = ${processIdOrName} } | ConvertTo-Json -Compress`
            : `Stop-Process -Name "${processIdOrName}" ${force ? '-Force' : ''}; [PSCustomObject]@{ closed = $true; target = "${processIdOrName}" } | ConvertTo-Json -Compress`;
        return await runPowerShell(script);
    },

    async focusWindow(windowTitleOrProcess) {
        const script = `
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class WinHelper {
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                }
"@
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*${windowTitleOrProcess}*" -or $_.ProcessName -like "*${windowTitleOrProcess}*" } | Select-Object -First 1
            if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
                [WinHelper]::ShowWindowAsync($proc.MainWindowHandle, 9) | Out-Null
                [WinHelper]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
                [PSCustomObject]@{ focused = $true; title = $proc.MainWindowTitle; pid = $proc.Id } | ConvertTo-Json -Compress
            } else {
                [PSCustomObject]@{ focused = $false; error = "Window not found" } | ConvertTo-Json -Compress
            }
        `;
        return await runPowerShell(script);
    },

    async getDisplayInfo() {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            $screens = [System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
                [PSCustomObject]@{
                    DeviceName = $_.DeviceName
                    Bounds = [PSCustomObject]@{ X = $_.Bounds.X; Y = $_.Bounds.Y; Width = $_.Bounds.Width; Height = $_.Bounds.Height }
                    Primary = $_.Primary
                    BitsPerPixel = $_.BitsPerPixel
                }
            }
            $screens | ConvertTo-Json -Compress
        `;
        const res = await runPowerShell(script);
        return Array.isArray(res) ? res : (res ? [res] : []);
    },

    // ── 2. Input Simulation (Mouse & Keyboard) ──────────────────────────────
    async simulateClick(x, y, button = "left", doubleClick = false) {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class MouseSimulator {
                    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
                }
"@
            [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
            Start-Sleep -Milliseconds 50

            $down = ${button === "right" ? "0x0008" : "0x0002"}
            $up = ${button === "right" ? "0x0010" : "0x0004"}

            [MouseSimulator]::mouse_event($down, 0, 0, 0, 0)
            Start-Sleep -Milliseconds 40
            [MouseSimulator]::mouse_event($up, 0, 0, 0, 0)

            ${doubleClick ? `
                Start-Sleep -Milliseconds 80
                [MouseSimulator]::mouse_event($down, 0, 0, 0, 0)
                Start-Sleep -Milliseconds 40
                [MouseSimulator]::mouse_event($up, 0, 0, 0, 0)
            ` : ""}

            [PSCustomObject]@{ clicked = $true; x = ${x}; y = ${y}; button = "${button}" } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async simulateType(text) {
        // Escape characters for SendKeys: + ^ % ~ { } [ ]
        const escaped = text.replace(/([+^%~{}()\[\]])/g, "{$1}").replace(/"/g, '`"');
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.SendKeys]::SendWait("${escaped}")
            [PSCustomObject]@{ typed = $true; length = ${text.length} } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    // ── 3. File System Operations (with Undo / Recycle Bin Safety) ───────────
    async searchFiles(searchTerm, startDir = "C:\\Users", maxResults = 25) {
        const script = `
            Get-ChildItem -Path "${startDir}" -Filter "*${searchTerm}*" -Recurse -ErrorAction SilentlyContinue | 
            Select-Object -First ${maxResults} FullName, Name, Length, LastWriteTime, @{Name="IsDirectory"; Expression={$_.PSIsContainer}} | 
            ConvertTo-Json -Compress
        `;
        const res = await runPowerShell(script, 15000);
        return Array.isArray(res) ? res : (res ? [res] : []);
    },

    async readFile(filePath, maxBytes = 100000) {
        const resolved = path.resolve(filePath);
        const stats = await fs.stat(resolved);
        if (stats.size > maxBytes) {
            const buf = Buffer.alloc(maxBytes);
            const handle = await fs.open(resolved, 'r');
            await handle.read(buf, 0, maxBytes, 0);
            await handle.close();
            return {
                content: buf.toString('utf-8'),
                truncated: true,
                totalSize: stats.size
            };
        }
        const content = await fs.readFile(resolved, 'utf-8');
        return { content, truncated: false, totalSize: stats.size };
    },

    async writeFile(filePath, content) {
        const resolved = path.resolve(filePath);
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        
        let previousContent = null;
        try {
            previousContent = await fs.readFile(resolved, 'utf-8');
        } catch {
            // New file
        }

        await fs.writeFile(resolved, content, 'utf-8');
        return {
            written: true,
            filePath: resolved,
            bytes: Buffer.byteLength(content, 'utf-8'),
            canUndo: true,
            undoPayload: {
                filePath: resolved,
                action: previousContent !== null ? 'revert_content' : 'delete_created',
                previousContent
            }
        };
    },

    async deleteFileSafe(targetPath) {
        // Send to Windows Recycle Bin via Microsoft.VisualBasic to support safe undo
        const script = `
            Add-Type -AssemblyName Microsoft.VisualBasic
            $p = "${targetPath.replace(/\\/g, '\\\\')}"
            if (Test-Path -Path $p) {
                if (Test-Path -Path $p -PathType Container) {
                    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
                } else {
                    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
                }
                [PSCustomObject]@{ deleted = $true; recycled = $true; path = $p } | ConvertTo-Json -Compress
            } else {
                [PSCustomObject]@{ deleted = $false; error = "Path not found" } | ConvertTo-Json -Compress
            }
        `;
        return await runPowerShell(script);
    },

    // ── 4. Clipboard Operations ─────────────────────────────────────────────
    async getClipboard() {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            $txt = [System.Windows.Forms.Clipboard]::GetText()
            $hasImg = [System.Windows.Forms.Clipboard]::ContainsImage()
            [PSCustomObject]@{
                type = if ($hasImg) { "image" } else { "text" }
                text = $txt
                hasImage = $hasImg
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async setClipboard(text) {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.Clipboard]::SetText("${text.replace(/"/g, '`"')}")
            [PSCustomObject]@{ updated = $true; length = ${text.length} } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    // ── 5. System Settings & Resource Telemetry ─────────────────────────────
    async getSystemMetrics() {
        const script = `
            $os = Get-CimInstance Win32_OperatingSystem
            $cs = Get-CimInstance Win32_ComputerSystem
            $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
            $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1

            [PSCustomObject]@{
                hostname = $cs.Name
                osName = $os.Caption
                osVersion = $os.Version
                cpuModel = $cpu.Name
                cpuLoad = $cpu.LoadPercentage
                totalMemoryMB = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
                freeMemoryMB = [math]::Round($os.FreePhysicalMemory / 1024, 0)
                memoryUsagePercent = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)
                batteryPercent = if ($battery) { $battery.EstimatedChargeRemaining } else { 100 }
                isCharging = if ($battery) { ($battery.BatteryStatus -eq 2) } else { $true }
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async setVolume(levelPercent) {
        const clamped = Math.max(0, Math.min(100, levelPercent));
        const script = `
            $obj = New-Object -ComObject WScript.Shell
            # Clear mute
            1..50 | ForEach-Object { $obj.SendKeys([char]174) }
            # Ramp up
            $steps = [math]::Round(${clamped} / 2)
            1..$steps | ForEach-Object { $obj.SendKeys([char]175) }
            [PSCustomObject]@{ volumeSet = ${clamped} } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async setBrightness(percent) {
        const clamped = Math.max(0, Math.min(100, percent));
        const script = `
            try {
                (Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${clamped})
                [PSCustomObject]@{ brightnessSet = ${clamped}; supported = $true } | ConvertTo-Json -Compress
            } catch {
                [PSCustomObject]@{ brightnessSet = ${clamped}; supported = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
            }
        `;
        return await runPowerShell(script);
    },

    // ── 6. Screenshots & Visual Screen Understanding ────────────────────────
    async captureScreenshot(targetBounds = null) {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing

            $bounds = ${targetBounds 
                ? `[System.Drawing.Rectangle]::new(${targetBounds.x}, ${targetBounds.y}, ${targetBounds.width}, ${targetBounds.height})`
                : `[System.Windows.Forms.Screen]::PrimaryScreen.Bounds`}

            $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bmp)
            $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $base64 = [Convert]::ToBase64String($ms.ToArray())

            $graphics.Dispose()
            $bmp.Dispose()
            $ms.Dispose()

            [PSCustomObject]@{
                success = $true
                width = $bounds.Width
                height = $bounds.Height
                base64 = $base64
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    // ── 7. Notifications ────────────────────────────────────────────────────
    async sendNotification(title, message) {
        const script = `
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
            $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
            $textNodes = $template.GetElementsByTagName("text")
            $textNodes.Item(0).AppendChild($template.CreateTextNode("${title.replace(/"/g, '`"')}")) | Out-Null
            $textNodes.Item(1).AppendChild($template.CreateTextNode("${message.replace(/"/g, '`"')}")) | Out-Null
            $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Parsu AI").Show($toast)
            [PSCustomObject]@{ sent = $true; title = "${title}" } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    // ── 8. Web & Browser Automation ─────────────────────────────────────────
    async openBrowserUrl(targetUrl) {
        const script = `
            Start-Process "${targetUrl}"
            [PSCustomObject]@{ opened = $true; url = "${targetUrl}" } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    }
};
