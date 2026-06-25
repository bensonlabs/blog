---
layout: post
title: "remote wakeonlan fix for TeamViewer with net rpc"
date: 2026-06-25
author: Justin Benson
categories: [TeamViewer,wakeonlan,Ubuntu,macOS,Windows]
---
# Remote wakeonlan fix for TeamViewer using net rpc
##### references: https://www.hackingarticles.in/active-directory-enumeration-net-rpc/

### 1. Wake the Hardware (From Mac)
```bash
## Check local ARP cache for MAC if needed (ping hostname to get IP), then: 
arp -a
brew install wakeonlan
wakeonlan <mac address>
ping <ip>
```

#### 2. Connect to a linux jump box & Install Tool If missing. (Ubuntu box)
```bash
ssh user@IP
sudo apt install samba-common-bin -y
```

#### 3. Check / Start Service (From jump box)
```bash
net rpc service start TeamViewer -I <IP address> -U <username> -W <domain name>
```
to stop service:
```bash
net rpc service stop TeamViewer -I <IP address> -U <username> -W <domain name>
```

#### 4. Force Reboot (If service is "Stop Pending" or frozen)
```bash
net rpc shutdown -r -f -I <IP address> -U <username> -W <domain name>
```

#### 5. Confirm Recovery
```bash
ping <IP address>
```

#### 6. Troubleshooting
If you see: (`WERR_SERVICE_ALREADY_RUNNING`), stop the service with Step 3 "stop" command. 
If you're stuck reboot the whole machine with Step 4 forced reboot.
