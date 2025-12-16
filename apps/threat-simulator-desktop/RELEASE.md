# Desktop App Release Guide

## Creating a Release

To create a new desktop application release, follow these steps:

### 1. Update Version

Update the version in `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.2.0"
}
```

### 2. Update Changelog

Add release notes to `CHANGELOG.md` documenting new features, bug fixes, and
breaking changes.

### 3. Create Release Tag

Push a tag with the format `desktop-v{version}`:

```bash
git tag desktop-v0.2.0
git push origin desktop-v0.2.0
```

This will automatically trigger the release workflow which will:

- Build native binaries for Windows, macOS (Intel + Apple Silicon), and Linux
- Create a GitHub release with all installers
- Upload release artifacts

### 4. Manual Release Trigger

Alternatively, you can manually trigger a release via GitHub Actions:

1. Go to Actions → "Release Desktop App"
2. Click "Run workflow"
3. Enter the version number (e.g., `0.2.0`)
4. Click "Run workflow"

## Release Artifacts

The workflow generates the following installers:

### Windows

- **MSI Installer**: `phoenix-rooivalk-threat-simulator_{version}_x64.msi`
  - Standard Windows installer package

### macOS

- **Intel DMG**: `phoenix-rooivalk-threat-simulator_{version}_x64-intel.dmg`
  - For Intel-based Macs
- **Apple Silicon DMG**: `phoenix-rooivalk-threat-simulator_{version}_arm64.dmg`
  - For M1/M2/M3 Macs

### Linux

- **AppImage**: `phoenix-rooivalk-threat-simulator_{version}_amd64.AppImage`
  - Portable, no installation required
  - Works on most Linux distributions
- **DEB Package**: `phoenix-rooivalk-threat-simulator_{version}_amd64.deb`
  - For Debian/Ubuntu-based distributions

## Icon Setup

The application uses icons defined in `src-tauri/tauri.conf.json`. To generate
all required icon sizes:

### Option 1: Using Tauri CLI (Recommended)

```bash
cd apps/threat-simulator-desktop
cargo tauri icon path/to/source-icon.png
```

This will generate all required icon sizes in `src-tauri/icons/`:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

**Source icon requirements:**

- At least 1024x1024 pixels
- PNG format
- Square (1:1 aspect ratio)
- Transparent background recommended

### Option 2: Manual Icon Creation

Place the following files in `src-tauri/icons/`:

```
icons/
├── 32x32.png       # 32×32 pixels
├── 128x128.png     # 128×128 pixels
├── 128x128@2x.png  # 256×256 pixels (Retina)
├── icon.icns       # macOS icon bundle
└── icon.ico        # Windows icon
```

## Testing Before Release

### Local Build Test

Test the build process locally before creating a release:

```bash
cd apps/threat-simulator-desktop

# Build WASM frontend
trunk build --release

# Build Tauri app
cargo tauri build
```

Installers will be created in `src-tauri/target/release/bundle/`.

### Platform-Specific Testing

**Windows:**

```powershell
# Install and test MSI
msiexec /i "target\release\bundle\msi\Phoenix Rooivalk Threat Simulator_0.1.0_x64_en-US.msi"
```

**macOS:**

```bash
# Mount and test DMG
open "target/release/bundle/dmg/Phoenix Rooivalk Threat Simulator_0.1.0_x64.dmg"
```

**Linux:**

```bash
# Test AppImage
chmod +x target/release/bundle/appimage/*.AppImage
./target/release/bundle/appimage/*.AppImage

# Test DEB
sudo dpkg -i target/release/bundle/deb/*.deb
```

## Troubleshooting

### Build Fails with Missing Dependencies

**Linux:**

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev
```

**macOS:**

```bash
xcode-select --install
```

**Windows:**

- Install
  [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Icon Generation Fails

If `cargo tauri icon` fails:

1. Ensure source icon is at least 1024×1024 pixels
2. Use PNG format with transparent background
3. Manually create icons using image editing software

### Workflow Fails to Find Artifacts

The workflow expects specific file paths. If builds succeed but uploads fail:

1. Check the bundle directory structure:

   ```bash
   ls -R src-tauri/target/release/bundle/
   ```

2. Update asset paths in `.github/workflows/release-desktop.yml` to match actual
   output

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API/feature changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:

- `0.1.0` → Initial release
- `0.2.0` → New features added
- `0.2.1` → Bug fixes
- `1.0.0` → First stable release

## Release Checklist

Before creating a release:

- [ ] Version updated in `tauri.conf.json`
- [ ] Changelog updated with release notes
- [ ] All tests passing (`cargo test`)
- [ ] Local build successful (`cargo tauri build`)
- [ ] Icons properly configured
- [ ] Code committed and pushed
- [ ] Tag created and pushed (or workflow triggered manually)

After release:

- [ ] Verify release appears on GitHub
- [ ] Download and test each platform installer
- [ ] Update documentation if needed
- [ ] Announce release to users

## Continuous Integration

The release workflow automatically:

1. ✅ Validates version format
2. ✅ Builds for all platforms in parallel
3. ✅ Creates GitHub release with changelogs
4. ✅ Uploads all installers as release assets
5. ✅ Verifies all artifacts uploaded successfully

No manual intervention required after pushing the tag!
