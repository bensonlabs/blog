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
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod https://raw.githubusercontent.com/bensonlabs/HW-Summer/v2026-summer-r2/scripts/bootstrap.ps1 -OutFile $env:TEMP\hw-summer-bootstrap.ps1; & $env:TEMP\hw-summer-bootstrap.ps1 -RepoRef v2026-summer-r2"
```

5. Wait for "Setup complete."
6. Reboot if prompted.
7. Logs: `C:\ProgramData\HW-Summer\Logs`
