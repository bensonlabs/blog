---
layout: post
title: "Ubuntu 20 - black screen using xrdp from Windows 10"
date: 2020-06-08
author: Justin Benson
categories: [ubuntu, linux, rdp, windows]
---

I installed **xrdp** via `sudo apt install xrdp`, but when connecting from a domain-joined Windows 10 computer I got a black screen after authenticating through the **xorg** session login.

After much failed sleuthing, I think I figured it out:

1. Terminate any open RDP attempts into Ubuntu.
2. Log out of your Ubuntu session.
3. Run `mstsc.exe` from Windows back into Ubuntu — it should now be at the Ubuntu login screen and should connect successfully this time.

*Root cause: unknown/not fully understood.*
