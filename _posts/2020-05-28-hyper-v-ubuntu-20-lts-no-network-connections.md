---
layout: post
title: "Hyper-V - Ubuntu 20 LTS no network connections"
date: 2020-05-28
author: Justin Benson
categories: [hyper-v, ubuntu, linux, networking]
---

**Problem:** Created a new Ubuntu 20 LTS VM in Hyper-V, but the installer found no network.

**Specs:**
- Type: Generation 1
- 8 GB RAM (dynamic)
- Default storage
- 4 vCPUs
- Stock [Ubuntu Server 20.04 LTS ISO](https://ubuntu.com/download/server)

**Observation:**

No matter what I tried — ensuring Default Network Adapter settings were set to External, or creating a Legacy Network adapter — nothing made a connection inside the VM.

**Solution:**

I re-rolled it.

- Deleted the Gen 1 VM and created a **Gen 2 VM** instead.
- Had to **turn off Secure Boot** in Settings for it to boot at all. This is a test VM, so security was not a consideration — plan accordingly.

![Hyper-V Generation 2 settings screenshot](/media/posts/7/hyperV-2.png)

**Extras:**

- Enhanced session with linux-vm-tools: [https://github.com/Microsoft/linux-vm-tools/wiki/Onboarding:-Ubuntu](https://github.com/Microsoft/linux-vm-tools/wiki/Onboarding:-Ubuntu)
