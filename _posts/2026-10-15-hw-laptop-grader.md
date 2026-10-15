---
layout: post
title: "HW Laptop Grader for Windows 11 Loaners"
date: 2026-10-15
author: Justin Benson
categories: [windows, powershell, hardware, loaners]
---

Former faculty and staff Windows 11 laptops need a consistent check before they are reassigned as student cart loaners, faculty/staff loaners, or Zoom loaners. HW Laptop Grader provides that check with dependency-free, stock PowerShell diagnostics.

It assesses battery health, storage health and performance, CPU model and clock speeds, CPU and memory performance, recent reliability events, Windows devices, plus network and security data. Version 0.1.3 also records the active Windows power plan, Windows edition/version/build, and BIOS version/date, with clearly labeled Windows best-effort power, thermal, and memory-diagnostic checks; these complement but do not replace Dell's preboot ePSA. Each run saves local JSON, CSV, and HTML results, then automatically submits the assessment over HTTPS to the HW Google Sheet collector.

Use the elevated PowerShell bootstrap command on the [bootstraps page]({{ '/bootstraps/' | relative_url }}). Keep the laptop on AC power and connected to the Internet while it runs.
