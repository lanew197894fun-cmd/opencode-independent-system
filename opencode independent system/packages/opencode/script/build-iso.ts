#!/usr/bin/env bun

import { $ } from "bun"
import { mkdtemp, cp, writeFile, mkdir } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

const version = "1.3.2"
const name = "opencode"
const isoName = `${name}-${version}-iso`

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), `${isoName}-`))
  console.log(`Created temp directory: ${tempDir}`)

  // Create directory structure
  const isoRoot = join(tempDir, "iso")
  await mkdir(join(isoRoot, "opencode"), { recursive: true })
  await mkdir(join(isoRoot, "opencode", "bin"), { recursive: true })
  await mkdir(join(isoRoot, "opencode", "dist"), { recursive: true })
  await mkdir(join(isoRoot, "opencode", "script"), { recursive: true })

  // Copy files
  await cp("dist", join(isoRoot, "opencode", "dist"), { recursive: true })
  await cp("bin", join(isoRoot, "opencode", "bin"), { recursive: true })
  await cp("package.json", join(isoRoot, "opencode", "package.json"))
  await cp("README.md", join(isoRoot, "opencode", "README.md"))
  await cp("bunfig.toml", join(isoRoot, "opencode", "bunfig.toml"))

  // Create install script
  const installScript = `#!/bin/bash
set -e

INSTALL_DIR="/usr/local/opencode"
BIN_DIR="/usr/local/bin"

echo "Installing OpenCode v${version}..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
cp -r opencode/* "$INSTALL_DIR/"

# Create symlink
ln -sf "$INSTALL_DIR/bin/opencode" "$BIN_DIR/opencode"

# Make binary executable
chmod +x "$INSTALL_DIR/bin/opencode"

echo "OpenCode installed successfully!"
echo "Run 'opencode' to start."
`

  await writeFile(join(isoRoot, "install.sh"), installScript, "utf8")
  await $`chmod +x ${join(isoRoot, "install.sh")}`

  // Create README for the ISO
  const readme = `OpenCode ISO Distribution
========================

This ISO contains OpenCode v${version} pre-built binaries.

Contents:
- bin/          - Executable scripts
- dist/         - Pre-compiled binaries for multiple platforms
- install.sh    - Installation script (run as root)

Installation:
1. Extract this ISO or mount it
2. Run sudo ./install.sh

Platforms included:
- Linux (x64, arm64, musl variants)
- macOS (x64, arm64)
- Windows (x64, arm64)
`

  await writeFile(join(isoRoot, "README.txt"), readme, "utf8")

  // Create ISO
  const outputIso = `${isoName}.iso`
  console.log(`Creating ISO: ${outputIso}`)

  // Use xorriso to create ISO
  await $`xorriso -as mkisofs \
    -o ${outputIso} \
    -R -J \
    -V "OPENCODE_${version}" \
    -joliet-long \
    -allow-lowercase \
    -allow-multidot \
    ${isoRoot}`.nothrow()

  console.log(`ISO created: ${outputIso}`)
  console.log(`ISO size: ${await $`du -h ${outputIso}`.text()}`)

  // Cleanup
  await $`rm -rf ${tempDir}`
  console.log("Cleanup completed.")
}

main().catch(console.error)
