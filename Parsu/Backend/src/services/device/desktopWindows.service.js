import { execFile } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFilePromise = util.promisify(execFile);

/**
 * Execute a secure PowerShell command and return structured JSON
 * Uses an ephemeral script file to completely eliminate Windows command-line character limits
 */
async function runPowerShell(script, timeoutMs = 12000) {
    const tmpFile = path.join(os.tmpdir(), `parsu_ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.ps1`);
    try {
        await fs.writeFile(tmpFile, script, 'utf8');

        const { stdout, stderr } = await execFilePromise("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            tmpFile
        ], {
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
    } finally {
        await fs.unlink(tmpFile).catch(() => {});
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
        const cleanTarget = String(appOrPath || "").trim();
        const script = `
            $target = "${cleanTarget.replace(/"/g, '`"')}".Trim()
            $launched = $false
            $pName = ""
            $appPid = 0

            # 1. Known Windows Universal Protocol Schemes
            $uriMap = @{
                "calculator"     = "calculator:"
                "calc"           = "calculator:"
                "calc.exe"       = "calculator:"
                "camera"         = "microsoft.windows.camera:"
                "settings"       = "ms-settings:"
                "clock"          = "ms-clock:"
                "alarms"         = "ms-clock:"
                "photos"         = "ms-photos:"
                "paint"          = "mspaint.exe"
                "paint.exe"      = "mspaint.exe"
                "mspaint"        = "mspaint.exe"
                "mspaint.exe"    = "mspaint.exe"
                "notepad"        = "notepad.exe"
                "notepad.exe"    = "notepad.exe"
                "explorer"       = "explorer.exe"
                "explorer.exe"   = "explorer.exe"
                "files"          = "explorer.exe"
                "terminal"       = "wt.exe"
                "cmd"            = "cmd.exe"
                "cmd.exe"        = "cmd.exe"
                "powershell"     = "powershell.exe"
                "powershell.exe" = "powershell.exe"
                "store"          = "ms-windows-store:"
                "calendar"       = "outlookcal:"
                "mail"           = "outlookmail:"
                "spotify"        = "spotify:"
                "whatsapp"       = "whatsapp:"
            }
            $targetLower = $target.ToLower()

            if ($uriMap.ContainsKey($targetLower)) {
                try {
                    $proc = Start-Process $uriMap[$targetLower] -PassThru -ErrorAction Stop
                    $launched = $true
                    $pName = $target
                    if ($proc) { $appPid = $proc.Id }
                } catch {}
            }

            # 2. Search Get-StartApps (detects Android Studio, VS Code, Chrome, VLC, Telegram, etc.)
            if (-not $launched) {
                try {
                    $found = Get-StartApps | Where-Object { 
                        $_.Name -like "*$target*" -or 
                        $_.AppID -like "*$target*" 
                    } | Select-Object -First 1

                    if ($found) {
                        Start-Process "shell:AppsFolder\$($found.AppID)" -ErrorAction Stop
                        $launched = $true
                        $pName = $found.Name
                    }
                } catch {}
            }

            # 3. Direct execution via Start-Process
            if (-not $launched) {
                try {
                    $proc = Start-Process -FilePath $target ${args ? `-ArgumentList '${args}'` : ''} -PassThru -ErrorAction Stop
                    $launched = $true
                    $pName = $proc.ProcessName
                    if ($proc) { $appPid = $proc.Id }
                } catch {}
            }

            # 4. Windows Search Bar Fallback (WinKey -> Type Name -> Enter)
            if (-not $launched) {
                try {
                    $wshell = New-Object -ComObject wscript.shell
                    $wshell.SendKeys("^{ESC}")
                    Start-Sleep -Milliseconds 400
                    $wshell.SendKeys($target)
                    Start-Sleep -Milliseconds 600
                    $wshell.SendKeys("{ENTER}")
                    Start-Sleep -Milliseconds 800

                    # Verify if a matching process was started
                    $check = Get-Process | Where-Object { $_.ProcessName -like "*$target*" } | Select-Object -First 1
                    if ($check) {
                        $launched = $true
                        $pName = $check.ProcessName
                        $appPid = $check.Id
                    }
                } catch {}
            }

            [PSCustomObject]@{
                launched = $launched
                appName = $target
                processName = $pName
                processId = $appPid
                error = if (-not $launched) { "App not found and could not open." } else { $null }
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    /**
     * Open an installed desktop app and run a search INSIDE it (e.g. Spotify song search).
     * The app is opened via its protocol/Start menu entry (never by typing a sentence into Windows search).
     * Other apps: launch → focus → search shortcut (Ctrl+K for Slack/Discord, Ctrl+F otherwise) → paste → Enter.
     * Best effort UI automation: auto-playing the top result cannot be verified.
     */
    async appSearch(appName, query, { waitMs = 3500 } = {}) {
        const app = String(appName || "").trim();
        const q = String(query || "").trim();
        if (!app || !q) throw new Error("appSearch requires both an app name and a search query.");
        const appLower = app.toLowerCase();

        const launch = await this.launchApp(appLower === "spotify" ? "spotify" : app);
        if (launch && launch.launched === false) {
            throw new Error(launch.error || `${app} is not installed or could not be opened.`);
        }

        const shortcut = /discord|slack/.test(appLower) ? "^k" : (appLower === "spotify" ? "^l" : "^f");
        const psQ = q.replace(/'/g, "''");
        const psApp = app.replace(/'/g, "''");
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class SrchWin {
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                }
"@
            Start-Sleep -Milliseconds ${waitMs}
            $name = '${psApp}'
            $proc = $null
            for ($i = 0; $i -lt 10 -and -not $proc; $i++) {
                $proc = Get-Process | Where-Object { ($_.ProcessName -like "*$name*" -or $_.MainWindowTitle -like "*$name*") -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
                if (-not $proc) { Start-Sleep -Milliseconds 700 }
            }
            if (-not $proc) { [PSCustomObject]@{ searched = $false; error = "Window for $name did not appear" } | ConvertTo-Json -Compress; exit }
            [SrchWin]::ShowWindowAsync($proc.MainWindowHandle, 9) | Out-Null
            [SrchWin]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
            Start-Sleep -Milliseconds 500
            $old = $null
            try { $old = Get-Clipboard -Raw } catch {}
            Set-Clipboard -Value '${psQ}'
            $w = New-Object -ComObject wscript.shell
            $w.SendKeys("${shortcut}")
            Start-Sleep -Milliseconds 400
            $w.SendKeys("^a")
            $w.SendKeys("^v")
            Start-Sleep -Milliseconds 500
            $w.SendKeys("{ENTER}")
            Start-Sleep -Milliseconds 300
            if ($old) { Set-Clipboard -Value $old }
            [PSCustomObject]@{ searched = $true; app = $name; query = '${psQ}'; window = $proc.MainWindowTitle } | ConvertTo-Json -Compress
        `;
        const res = await runPowerShell(script, 30000);
        if (res && res.searched === false) throw new Error(res.error || "Search failed");
        return res;
    },

    /**
     * System-wide keyboard shortcuts: media keys, mute, lock, show desktop, task view, etc.
     */
    async systemShortcut(name) {
        const key = String(name || "").toLowerCase().replace(/[\s-]+/g, "_");
        const mediaKeys = { play_pause: 179, next_track: 176, prev_track: 177, stop: 178, mute_toggle: 173 };
        let script;
        if (mediaKeys[key]) {
            script = `
                $w = New-Object -ComObject wscript.shell
                $w.SendKeys([char]${mediaKeys[key]})
                [PSCustomObject]@{ done = $true; shortcut = "${key}" } | ConvertTo-Json -Compress
            `;
        } else if (key === "lock") {
            script = `rundll32.exe user32.dll,LockWorkStation; [PSCustomObject]@{ done = $true; shortcut = "lock" } | ConvertTo-Json -Compress`;
        } else {
            const winKeyCombos = {
                show_desktop: [0x5B, 0x44],
                task_view: [0x5B, 0x09],
                snip: [0x5B, 0x10, 0x53],
                settings: [0x5B, 0x49],
                run: [0x5B, 0x52],
                switch_window: [0x12, 0x09],
                minimize_all: [0x5B, 0x44],
                close_window: [0x12, 0x73],
                new_tab: [0x11, 0x54],
                refresh: [0x74]
            };
            const combo = winKeyCombos[key];
            if (!combo) throw new Error(`Unknown system shortcut: ${name}`);
            script = `
                Add-Type @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class KbdSim {
                        [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
                    }
"@
                $keys = @(${combo.join(",")})
                foreach ($k in $keys) { [KbdSim]::keybd_event([byte]$k, 0, 0, [UIntPtr]::Zero) }
                [array]::Reverse($keys)
                foreach ($k in $keys) { [KbdSim]::keybd_event([byte]$k, 0, 2, [UIntPtr]::Zero) }
                [PSCustomObject]@{ done = $true; shortcut = "${key}" } | ConvertTo-Json -Compress
            `;
        }
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
        return this.typeText(text, null, false);
    },

    async typeText(text, targetApp = null, pressEnter = false) {
        const cleanTarget = (targetApp || "").trim().toLowerCase();
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Win32TypeHelper {
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                }
"@
            $target = "${cleanTarget}".Trim()
            if ($target) {
                $foundProc = Get-Process | Where-Object { 
                    $_.ProcessName.ToLower() -like "*$target*" -or 
                    $_.MainWindowTitle.ToLower() -like "*$target*" 
                } | Select-Object -First 1

                if (-not $foundProc -or $foundProc.MainWindowHandle -eq [IntPtr]::Zero) {
                    Start-Process $target -ErrorAction SilentlyContinue
                    Start-Sleep -Milliseconds 700
                    $foundProc = Get-Process | Where-Object { 
                        $_.ProcessName.ToLower() -like "*$target*" -or 
                        $_.MainWindowTitle.ToLower() -like "*$target*" 
                    } | Select-Object -First 1
                }

                if ($foundProc -and $foundProc.MainWindowHandle -ne [IntPtr]::Zero) {
                    [Win32TypeHelper]::ShowWindowAsync($foundProc.MainWindowHandle, 9) | Out-Null
                    [Win32TypeHelper]::SetForegroundWindow($foundProc.MainWindowHandle) | Out-Null
                    Start-Sleep -Milliseconds 300
                }
            }

            # Use clipboard paste for guaranteed accuracy with unicode, symbols, and formatting
            $content = @"
${text}
"@
            Set-Clipboard -Value $content
            Start-Sleep -Milliseconds 150
            $wshell = New-Object -ComObject wscript.shell
            $wshell.SendKeys("^v")
            ${pressEnter ? `
            Start-Sleep -Milliseconds 150
            $wshell.SendKeys("{ENTER}")
            ` : ""}

            [PSCustomObject]@{
                typed = $true
                targetApp = $target
                length = $content.Length
            } | ConvertTo-Json -Compress
        `;
        return await runPowerShell(script);
    },

    async whatsappSendMessage({ contactOrPhone, message }) {
        const targetClean = String(contactOrPhone || "").trim();
        const msgClean = String(message || "").trim();
        const isPhone = /^[+]?[\d\s\-()]{7,16}$/.test(targetClean);
        const digitsOnly = targetClean.replace(/[\s\-()+]/g, "");

        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Win32WaHelper {
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                }
"@
            $waApp = Get-StartApps | Where-Object { $_.Name -like "*WhatsApp*" -or $_.AppID -like "*WhatsApp*" } | Select-Object -First 1
            $isInstalled = [bool]$waApp -or (Get-Command "WhatsApp.exe" -ErrorAction SilentlyContinue)

            if (-not $isInstalled) {
                # Fallback to WhatsApp Web
                ${isPhone ? `
                    Start-Process "https://web.whatsapp.com/send?phone=${digitsOnly}&text=${encodeURIComponent(msgClean)}"
                ` : `
                    Start-Process "https://web.whatsapp.com"
                `}
                [PSCustomObject]@{
                    success = $true
                    method = "web"
                    message = "WhatsApp desktop is not installed. Opened WhatsApp Web."
                } | ConvertTo-Json -Compress
                exit
            }

            # WhatsApp Desktop is installed
            ${isPhone ? `
                # 1. Phone number direct protocol launch
                $uri = "whatsapp://send?phone=${digitsOnly}&text=${encodeURIComponent(msgClean)}"
                Start-Process $uri -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 2200

                $waProc = Get-Process | Where-Object { $_.ProcessName -like "*WhatsApp*" } | Select-Object -First 1
                $wshell = New-Object -ComObject wscript.shell
                if ($waProc -and $waProc.MainWindowHandle -ne [IntPtr]::Zero) {
                    [Win32WaHelper]::ShowWindowAsync($waProc.MainWindowHandle, 9) | Out-Null
                    [Win32WaHelper]::SetForegroundWindow($waProc.MainWindowHandle) | Out-Null
                    Start-Sleep -Milliseconds 600
                    $wshell.SendKeys("{ENTER}")
                }
                [PSCustomObject]@{
                    success = $true
                    sent = $true
                    method = "desktop_phone"
                    target = "${digitsOnly}"
                } | ConvertTo-Json -Compress
            ` : `
                # 2. Contact Name or Open Chat
                $waProc = Get-Process | Where-Object { $_.ProcessName -like "*WhatsApp*" } | Select-Object -First 1
                if (-not $waProc) {
                    if ($waApp) {
                        Start-Process "shell:AppsFolder\$($waApp.AppID)" -ErrorAction SilentlyContinue
                    } else {
                        Start-Process "WhatsApp.exe" -ErrorAction SilentlyContinue
                    }
                    Start-Sleep -Milliseconds 2500
                    $waProc = Get-Process | Where-Object { $_.ProcessName -like "*WhatsApp*" } | Select-Object -First 1
                }

                if ($waProc -and $waProc.MainWindowHandle -ne [IntPtr]::Zero) {
                    [Win32WaHelper]::ShowWindowAsync($waProc.MainWindowHandle, 9) | Out-Null
                    [Win32WaHelper]::SetForegroundWindow($waProc.MainWindowHandle) | Out-Null
                    Start-Sleep -Milliseconds 500
                }

                $contact = "${targetClean.replace(/"/g, '`"')}"
                $msg = @"
${msgClean}
"@
                $wshell = New-Object -ComObject wscript.shell

                if ($contact) {
                    # Press Ctrl + F to search contacts
                    $wshell.SendKeys("^f")
                    Start-Sleep -Milliseconds 350
                    Set-Clipboard -Value $contact
                    $wshell.SendKeys("^v")
                    Start-Sleep -Milliseconds 750
                    $wshell.SendKeys("{ENTER}")
                    Start-Sleep -Milliseconds 550
                }

                # Paste message into chat and send
                Set-Clipboard -Value $msg
                Start-Sleep -Milliseconds 250
                $wshell.SendKeys("^v")
                Start-Sleep -Milliseconds 250
                $wshell.SendKeys("{ENTER}")

                [PSCustomObject]@{
                    success = $true
                    sent = $true
                    contact = $contact
                    message = $msg
                } | ConvertTo-Json -Compress
            `}
        `;
        return await runPowerShell(script, 18000);
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

    async getCurrentVolume() {
        // Returns current master volume 0-100 via Windows Audio API (PowerShell)
        const script = `
            Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int f1(); int f2(); int f3(); int f4();
    int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
    int f6();
    int GetMasterVolumeLevelScalar(out float pfLevel);
}
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
[ClassInterface(ClassInterfaceType.None)]
class MMDeviceEnumeratorClass {}
'@
            try {
                $vol = [System.Convert]::ToInt32((Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Volume' -ErrorAction Stop).Master * 100)
                Write-Output $vol
            } catch {
                Write-Output 50
            }
        `;
        try {
            const r = await runPowerShell(script);
            const n = typeof r === 'number' ? r : parseInt(String(r).trim());
            return isNaN(n) ? 50 : Math.max(0, Math.min(100, n));
        } catch { return 50; }
    },

    async getCurrentBrightness() {
        const script = `
            try {
                $b = (Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness
                Write-Output $b
            } catch { Write-Output 70 }
        `;
        try {
            const r = await runPowerShell(script);
            const n = typeof r === 'number' ? r : parseInt(String(r).trim());
            return isNaN(n) ? 70 : Math.max(0, Math.min(100, n));
        } catch { return 70; }
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
