---
layout: post
title: "macOS - Remove SafeMine profile"
date: 2021-05-11
author: Justin Benson
categories: [macos, malware, security]
---

SafeMine installs an admin profile that locks Chrome settings. Here's how to remove it.

1. **Save these steps somewhere safe and close Chrome.**
2. Click the **Preferences** (System Preferences) icon in your Mac's menu bar and select **Profiles**.
3. Select all **AdminPrefs** profile(s) and delete them by clicking the minus (−) icon at the bottom.
4. Once you've removed the unwanted "adminprefs" profile(s), open the **Terminal** app (`Go > Utilities > Terminal` or press `⌘Space` and search Terminal).
5. Enter the commands below, pressing Enter after each one:

```bash
defaults write com.google.Chrome HomepageIsNewTabPage -bool false
defaults write com.google.Chrome NewTabPageLocation -string "https://www.google.com/"
defaults write com.google.Chrome HomepageLocation -string "https://www.google.com/"
defaults delete com.google.Chrome DefaultSearchProviderSearchURL
defaults delete com.google.Chrome DefaultSearchProviderNewTabURL
defaults delete com.google.Chrome DefaultSearchProviderName
```

6. Restart Chrome. The issue should be resolved. If not, restart your Mac.

**Reference:** [https://support.google.com/chrome/thread/9350623](https://support.google.com/chrome/thread/9350623?hl=en)
