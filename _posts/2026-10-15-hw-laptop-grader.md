---
layout: post
title: "HW Laptop Grader for Windows 11 Loaners"
date: 2026-10-15
author: Justin Benson
categories: [windows, powershell, hardware, loaners]
---

Former faculty and staff Windows 11 laptops need a consistent check before they are reassigned as student cart loaners, faculty/staff loaners, or Zoom loaners. HW Laptop Grader provides that check with dependency-free, stock PowerShell diagnostics.

It assesses battery health, storage health and performance, CPU model and clock speeds, CPU and memory performance, recent reliability events, Windows devices, plus network and security data. Version 0.1.7 adds GPU/driver and display details, free system-drive capacity, BitLocker status, and detected camera, audio, keyboard, touchpad, and Wi-Fi hardware. It identifies candidate student-cart, faculty/staff, and Zoom-loaner roles only when automated evidence is clean, then explicitly requires an operator to confirm camera, microphone, speakers, keyboard, touchpad, Wi-Fi, and AC charging. It records the Windows activation channel when available—OEM, Retail, or Volume—without collecting a product key, as well as the active Windows power plan, Windows edition/version/build, and BIOS version/date. Clearly labeled Windows best-effort power, thermal, and memory-diagnostic checks complement but do not replace Dell's preboot ePSA. Each run saves local JSON, CSV, and HTML results, then automatically submits the assessment over HTTPS to the HW Google Sheet collector.

Use the elevated PowerShell bootstrap command on the [bootstraps page]({{ '/bootstraps/' | relative_url }}). Keep the laptop on AC power and connected to the Internet while it runs.
