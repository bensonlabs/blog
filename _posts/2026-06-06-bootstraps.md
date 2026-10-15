---
layout: post
title: "bootstraps"
date: 2026-06-06
author: Justin Benson
categories: [windows, macos, fedora, ubuntu, wsl, wsl2, dev, ai]
---

# bootstraps for windows, macOS, Fedora KDE Plasma

## Windows - AI dev env

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_windows.ps1 -OutFile bootstrap_windows.ps1; .\bootstrap_windows.ps1
```
**Notes:**
1. Needs to run in an elevated PowerShell window (right-click → Run as Administrator). The script installs system-level software, so it'll fail partway through without admin
  rights. 
2. Run the Ubuntu bootstrap script in the WSL Ubuntu app or WSL2 terminal.

## Windows - Loaner checkout app VM

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_windows_tracker.ps1 -OutFile bootstrap_windows_tracker.ps1; .\bootstrap_windows_tracker.ps1
```

## Windows - HW Laptop Grader

Run this in an elevated PowerShell window on a representative outgoing Windows 11 laptop with AC power and Internet access. It downloads the fixed `v0.1.5` grader distribution, collects a local assessment, and submits the result to the HW Google Sheet collector.

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/bootstraps/hw-laptop-grader-v0.1.5/distributions/hw-laptop-grader/v0.1.5/scripts/bootstrap.ps1 -OutFile $env:TEMP\hw-laptop-grader-bootstrap.ps1; & $env:TEMP\hw-laptop-grader-bootstrap.ps1 -CollectorUrl 'https://script.google.com/macros/s/AKfycbxFY1EBk3hhVhqSmnTzHIJB0nuIcmvqEjxlDJYxO6RPQD6qg-_-EK3KKojiEW9Ne_N4/exec'
```

The grader writes JSON, CSV, and HTML results under `C:\ProgramData\HW-Laptop-Grader\Results`.
  
## macOS

```zsh
bash <(curl -fsSL https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_macOS.sh)
```

## Fedora

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_fedora.sh)
```

## Ubuntu

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_ubuntu.sh)
```

  
