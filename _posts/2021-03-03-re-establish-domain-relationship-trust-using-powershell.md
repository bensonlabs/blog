---
layout: post
title: "Re-Establish Domain Relationship trust using PowerShell"
date: 2021-03-03
author: Justin Benson
categories: [windows, powershell, active-directory]
---

When a Windows 10 machine loses its trust relationship with the domain, you can re-establish it without rejoining the domain using PowerShell.

1. Log on to Windows 10 using the **local Administrator** account.
2. Open a PowerShell terminal **as admin**.
3. Run the following and press Enter:
   ```powershell
   $credential = Get-Credential
   ```
4. Enter **your domain account** (which has admin rights) and password, then click OK.
5. Run the following and press Enter:
   ```powershell
   Reset-ComputerMachinePassword -Credential $credential
   ```
6. Close PowerShell.
7. Restart the machine.
8. Log on to Windows 10 using your **domain user account**.
