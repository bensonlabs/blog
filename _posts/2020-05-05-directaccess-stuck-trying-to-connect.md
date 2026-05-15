---
layout: post
title: "DirectAccess stuck connecting"
date: 2020-05-05
author: Justin Benson
categories: [windows, networking, vpn]
---

If a computer is stuck trying to connect via DirectAccess, here's how to fix it:

1. Remote into the computer with DirectAccess issues.
2. Copy the install folder of your VPN over the remote connection.
3. Install and connect through VPN, then run this **2 times** in CMD with admin privileges:
   ```
   GPUPDATE /FORCE
   ```
4. Sign out / sign in.
5. Uninstall the VPN (DirectAccess might not let you connect to folders until VPN is disconnected — better to just uninstall it).
