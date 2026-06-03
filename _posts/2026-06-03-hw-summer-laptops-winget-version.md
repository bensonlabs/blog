---
layout: post
title: "hw-summer-laptops-winget-version"
date: 2026-06-03
author: Justin Benson
categories: [Windows, Dell, Lego, Arduino]
---

## Instructions:
1. Open terminal as admin, type CMD

```cmd
@echo off
echo ===================================================
echo Installing Arduino IDE 2.3.9 and LEGO SPIKE 3.6.1
echo ===================================================

echo.
echo [1/2] Installing Arduino IDE 2.3.9...
winget install --id ArduinoSA.IDE.stable --version 2.3.9 --accept-source-agreements --accept-package-agreements

echo.
echo [2/2] Installing LEGO Education SPIKE 3.6.1...
winget install --id LEGO.LEGOEducationSPIKE --version 3.6.1 --accept-source-agreements --accept-package-agreements

echo.
echo ===================================================
echo Installation complete!
echo ===================================================
pause
```
