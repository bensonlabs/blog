---
layout: post
title: "bootstraps"
date: 2026-06-06
author: Justin Benson
categories: [windows, macos, fedora,]
---

# bootstraps for windows, macOS, Fedora KDE Plasma

## Windows

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/bootstraps/main/scripts/bootstrap_windows.ps1 -OutFile bootstrap_windows.ps1; .\bootstrap_windows.ps1
```
Notes: Needs to run in an elevated PowerShell window (right-click → Run as Administrator). The script installs system-level software, so it'll fail partway through without admin
  rights. 
  
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

  
