---
layout: post
title: "bootstraps"
date: 2026-06-06
author: Justin Benson
categories: [windows, macos, fedora, ubuntu, wsl, wsl2, dev, ai]
---

# bootstraps for windows, macOS, Fedora KDE Plasma

## Windows

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_windows.ps1 -OutFile bootstrap_windows.ps1; .\bootstrap_windows.ps1
```
**Notes:**
1. Needs to run in an elevated PowerShell window (right-click → Run as Administrator). The script installs system-level software, so it'll fail partway through without admin
  rights. 
2. Run the Ubuntu bootstrap script in the WSL Ubuntu app or WSL2 terminal.
  
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

  
