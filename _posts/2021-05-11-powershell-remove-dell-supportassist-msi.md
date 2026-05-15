---
layout: post
title: "PowerShell - Remove Dell SupportAssist"
date: 2021-05-11
author: Justin Benson
categories: [powershell, windows, dell]
---

Two quick PowerShell commands to remove Dell SupportAssist — one for the MSI/traditional install, one for the Windows Store app.

```powershell
# Remove Dell SupportAssist (MSI install)
Uninstall-Package -ProviderName msi -Name 'Dell SupportAssist'

# Remove Dell SupportAssist (Windows Store app)
Get-AppxPackage *SupportAssist* | Remove-AppPackage
```

Run PowerShell as administrator before executing these commands.
