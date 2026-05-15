---
layout: post
title: "PowerShell - Log IP status"
date: 2020-05-07
author: Justin Benson
categories: [powershell, networking, windows]
---

A simple PowerShell script to ping a list of IP addresses or hostnames and log whether each one is up or down, with a timestamp.

```powershell
# Gets a list of computer names or IPs from a .txt file.
$names = Get-Content '<location of .txt file full of IP addresses>'

# Sets the name and location of your output .CSV file.
$IPstatus = '<location of .csv file>'

$date = Get-Date

# Pings each device in your list.
foreach ($name in $names) {
    if (Test-Connection -ComputerName $name -Count 1 -ErrorAction SilentlyContinue) {
        # logs all UP IPs with timestamp
        Add-Content -Value "$name,up,$date" -Path $IPstatus
    }
    else {
        # logs all DOWN IPs with timestamp
        Add-Content -Value "$name,down,$date" -Path $IPstatus
    }
}
```

Replace the two placeholder paths with the actual paths to your input `.txt` file and output `.csv` file before running.
