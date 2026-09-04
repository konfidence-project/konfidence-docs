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

To update, **re-run the installer** — the same command you used to install:

```bash
curl -fsSL https://konfidence.cloud/install.sh | sh
```

`kden` does not update itself. Because the CLI talks to the Konfidence API and controllers
in your cluster, updating is left to you: a CLI that silently jumped ahead of an older
server could break in confusing ways. Re-running the installer lets you update deliberately,
when it suits your environment. Pin a specific release with `KDEN_VERSION` if you need to
match a particular server version.

Check what you're running — including build metadata and the update command — with:

```bash
kden version                 # JSON by default
kden version --output pretty # human-readable
```

## Windows

The installer supports Linux and macOS. On Windows, download the `kden`
archive for your platform from the
[latest release](https://github.com/konfidence-project/konfidence/releases/latest) and place the
extracted binary on your `PATH`.
