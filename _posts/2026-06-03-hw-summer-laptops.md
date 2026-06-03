---
layout: post
title: "hw-summer-laptops"
date: 2026-06-03
author: Justin Benson
categories: [powershell, windows, dell]
---

## Final rollout command

1. Log in as loaner.
2. Right-click Start.
3. Open Terminal / PowerShell as Administrator.
4. Paste the entire command below.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod https://raw.githubusercontent.com/bensonlabs/HW-Summer/v2026-summer/scripts/bootstrap.ps1 -OutFile $env:TEMP\hw-summer-bootstrap.ps1; & $env:TEMP\hw-summer-bootstrap.ps1"
```

5. Wait for "Setup complete."
6. Reboot if prompted.
7. Logs: `C:\ProgramData\HW-Summer\Logs`

## Testing command

Use this before the `v2026-summer` tag exists:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod https://raw.githubusercontent.com/bensonlabs/HW-Summer/main/scripts/bootstrap.ps1 -OutFile $env:TEMP\hw-summer-bootstrap.ps1; & $env:TEMP\hw-summer-bootstrap.ps1"
```

Planning note: the `v2026-summer` command should be the only one visible or emphasized when you’re doing the real 20-laptop pass. The `main` command is just for VM testing while we’re still changing scripts.

