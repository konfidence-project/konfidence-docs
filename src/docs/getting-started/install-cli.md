---
title: Install the CLI
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

Set `KDEN_GIT_REF` to build from a branch, tag, or commit instead of a release. This requires
[Go](https://go.dev/dl/) to be installed and is intended for contributors or for platforms
without a published binary:

```bash
curl -fsSL https://konfidence.cloud/install.sh | KDEN_GIT_REF=main sh
```

## Choose the install location

Set `KDEN_INSTALL_DIR` to install somewhere other than `~/.local/bin`:

```bash
curl -fsSL https://konfidence.cloud/install.sh | KDEN_INSTALL_DIR=/usr/local/bin sh
```

## Keep it up to date

`kden` self-updates in place — no need to re-run the installer:

```bash
kden upgrade
```

This downloads the latest release, verifies its checksum, and atomically replaces the running
binary. Use `KDEN_VERSION` to upgrade (or downgrade) to a specific release.

When a newer release is available, `kden` prints a one-line reminder to stderr at most once a
day. To silence it, set `KDEN_NO_UPDATE_NOTIFIER` in your environment:

```bash
export KDEN_NO_UPDATE_NOTIFIER=1
```

The reminder is automatically suppressed in CI and when output is not an interactive terminal.

## Windows

The installer and `kden upgrade` support Linux and macOS. On Windows, download the `kden`
archive for your platform from the
[latest release](https://github.com/konfidence-project/konfidence/releases/latest) and place the
extracted binary on your `PATH`.
