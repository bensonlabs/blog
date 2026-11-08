---
layout: post
title: "HW Testing Laptop Provisioner for Offline Windows 11 Testing"
date: 2026-11-03
author: Justin Benson
categories: [windows, powershell, libreoffice, testing]
---

Run this in **Windows PowerShell as Administrator** while the laptop is online. The same command is also available on the [bootstraps page]({{ '/bootstraps/#windows---offline-testing-laptop-provisioner' | relative_url }}).

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; irm https://raw.githubusercontent.com/bensonlabs/hw-testing-laptop-provisioner/main/scripts/provision.ps1 -OutFile $env:TEMP\hw-testing-laptop-provision.ps1 -ErrorAction Stop; & $env:TEMP\hw-testing-laptop-provision.ps1
```

Standalone Windows laptops used in offline testing environments need a consistent setup before handoff. HW Testing Laptop Provisioner prepares freshly installed Windows 11 26H2 laptops while Internet access is still available, without requiring Intune, SCCM, or a Microsoft 365 entitlement.

It installs LibreOffice through winget and applies machine-wide defaults for Writer's Arial font and Microsoft Word DOCX save format, plus the user's Desktop as LibreOffice's default save folder. An existing LibreOffice installation is reused without upgrading, and the provisioner can be rerun. It checks for Arial, verifies the configuration payload and LibreOffice console startup, then writes a provisioning log and PASS/FAIL summary. Existing user preferences or templates can override the defaults, so the actual testing account still needs a manual check.

After all automated checks pass, confirm Arial in a new Writer document, save a DOCX to Desktop, and reopen it. Then manually disable the wireless radio in BIOS and confirm the laptop has no network connection, including Ethernet or a dock, before handoff.
