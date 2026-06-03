---
layout: post
title: "hw-summer-laptops"
date: 2026-06-03
author: Justin Benson
categories: [powershell, windows, dell]
---
1. Log in as loaner.
2. Right-click Start.
3. Open Terminal / PowerShell as Administrator.
4. Paste the command.
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod https://raw.githubusercontent.com/bensonlabs/HW-Summer/v2026-summer/scripts/bootstrap.ps1 -OutFile $env:TEMP\hw-summer-bootstrap.ps1; & $env:TEMP\hw-summer-bootstrap.ps1"
```
5. Wait for “Setup complete.”
6. Reboot if prompted.
7. Logs: C:\ProgramData\HW-Summer\Logs
8. Use during testing:
```powershell
https://raw.githubusercontent.com/bensonlabs/HW-Summer/main/scripts/bootstrap.ps1
```
