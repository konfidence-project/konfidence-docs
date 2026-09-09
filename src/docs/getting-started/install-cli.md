---
title: Installing the Kden CLI
description: Install the kden command-line interface on Linux or macOS with a single command.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install the CLI

`kden` is the Konfidence command-line interface. Install it on Linux or macOS with one command:

```bash
curl -fsSL https://konfidence.cloud/install.sh | sh
```

This downloads the latest release for your platform, verifies its checksum, and installs the
binary to `~/.local/bin`. No package manager and no `sudo` required.

If `~/.local/bin` is not on your `PATH`, the installer prints the line to add to your shell
profile. Verify the install with:

```bash
kden version
```

## Install a specific version

Set `KDEN_VERSION` to pin a release tag:

```bash
curl -fsSL https://konfidence.cloud/install.sh | KDEN_VERSION=v0.3.0 sh
```

## Build from source

Set `KDEN_GIT_REF` to build from a branch, tag, or commit instead of a release. The installer
clones the repo and compiles it, so you need both [git](https://git-scm.com/downloads) and
[Go](https://go.dev/dl/) installed. This path is intended for contributors or for platforms
without a published binary:

```bash
curl -fsSL https://konfidence.cloud/install.sh | KDEN_GIT_REF=main sh
```

## Avoid GitHub rate limits in CI

Without a release tag, the installer asks the GitHub API for the latest release. Anonymous
requests share a 60-per-hour limit per IP, which CI runners exhaust quickly. Set `GITHUB_TOKEN`
to authenticate and raise that limit:

```bash
curl -fsSL https://konfidence.cloud/install.sh | GITHUB_TOKEN=$GITHUB_TOKEN sh
```

## Choose the install location

Set `KDEN_INSTALL_DIR` to install somewhere other than `~/.local/bin`:

```bash
curl -fsSL https://konfidence.cloud/install.sh | KDEN_INSTALL_DIR=/usr/local/bin sh
```

## Keep it up to date

To update, **re-run the installer** — the same command you used to install:

```bash
curl -fsSL https://konfidence.cloud/install.sh | sh
```

Check what you're running with:

```bash
kden version                 # JSON by default
kden version --output pretty # human-readable
```

## Windows

The installer supports Linux and macOS. On Windows, download the `kden`
archive for your platform from the
[latest release](https://github.com/konfidence-project/konfidence/releases/latest) and place the
extracted binary on your `PATH`.
