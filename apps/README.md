# Applications Directory

This directory contains all applications and services that make up the
PhoenixRooivalk platform.

## Overview

The `apps/` directory is organized as a monorepo structure, containing
multiple independent applications and services that work together to provide
the complete counter-drone defense system.

## Applications

### Web Applications

#### `docs/` - Documentation Site

- **Type**: Docusaurus static site
- **Purpose**: Comprehensive technical documentation portal
- **Tech Stack**: Docusaurus, React, TypeScript
- **Deployment**: Azure Static Web Apps (published under `/docs`)
- **Documentation**: [apps/docs/README.md](docs/README.md)
- **Features**:
  - Executive summaries and pitch materials
  - Technical architecture and specifications
  - Business plans and market analysis
  - Operations manuals and deployment guides
  - Legal and compliance frameworks

#### `marketing/` - Marketing Website

- **Type**: Next.js 14 static site
- **Purpose**: Public-facing marketing site with interactive demos
- **Tech Stack**: Next.js 14, React, TypeScript
- **Deployment**: Azure Static Web Apps (exports to `out/`)
- **Documentation**: [apps/marketing/README.md](marketing/README.md)
- **Features**:
  - Threat simulator
  - ROI calculator
  - Interactive demos
  - Career application system
  - User authentication

### Desktop Applications

#### `threat-simulator-desktop/` - Desktop Threat Simulator

- **Type**: Tauri desktop application
- **Purpose**: Desktop version of threat simulator with blockchain evidence recording
- **Tech Stack**: Rust, Leptos/WASM, Tauri
- **Documentation**: [apps/threat-simulator-desktop/README.md](threat-simulator-desktop/README.md)
- **Features**:
  - Desktop-native threat simulation
  - Blockchain evidence recording
  - Offline capability

### Edge/Embedded Applications

#### `detector/` - Drone Detection System

- **Type**: Python application
- **Purpose**: Real-time drone detection for edge devices
- **Tech Stack**: Python, TensorFlow Lite, OpenCV, Pydantic
- **Platforms**: Raspberry Pi, NVIDIA Jetson, Desktop
- **Documentation**: [apps/detector/README.md](detector/README.md)
- **Features**:
  - Modular architecture with hot-swappable components
  - Multiple frame sources (Pi Camera, USB, video files, mock)
  - Multiple inference engines (TFLite, ONNX, Coral TPU, mock)
  - Object tracking (Centroid, Kalman)
  - Streaming server
  - Alert system with webhooks
  - Configuration via YAML files

### Backend Services

#### `api/` - API Server

- **Type**: Rust web server
- **Purpose**: Backend API for platform services
- **Tech Stack**: Rust, Axum
- **Documentation**: See [apps/api/docs/](api/docs/) for deployment and
  database patterns
- **Features**:
  - RESTful API endpoints
  - Database integration patterns
  - Deployment configurations

#### `keeper/` - Blockchain Keeper Service

- **Type**: Rust service
- **Purpose**: Blockchain keeper service for evidence anchoring
- **Tech Stack**: Rust
- **Features**:
  - Automated blockchain anchoring
  - Evidence management
  - Multi-chain support (Solana, EtherLink)

#### `evidence-cli/` - Evidence Management CLI

- **Type**: Rust CLI tool
- **Purpose**: Command-line interface for evidence management
- **Tech Stack**: Rust
- **Usage**:

  ```bash
  cargo run --manifest-path apps/evidence-cli/Cargo.toml -- <command>
  ```

### Utility Directories

#### `scripts/` - Application Scripts

- **Purpose**: Utility scripts specific to applications
- **Note**: Root-level scripts are in the repository root `scripts/` directory

## Development

### Running Applications Locally

See the root [README.md](../README.md) for development commands and setup
instructions.

### Building Applications

```bash
# Build all applications
pnpm build

# Build specific application
pnpm --filter marketing build
pnpm --filter docs build

# Run Rust services
cargo run --manifest-path apps/api/Cargo.toml
cargo run --manifest-path apps/keeper/Cargo.toml
```

### Testing

```bash
# Run Python detector tests
cd apps/detector
pytest

# Run Rust tests
cargo test --manifest-path apps/api/Cargo.toml
cargo test --manifest-path apps/keeper/Cargo.toml
```

## Deployment

Each application has its own deployment configuration:

- **Web Apps** (docs, marketing): Deployed to Azure Static Web Apps via
  GitHub Actions
- **API**: Deployed to Azure Functions or App Service
- **Detector**: Deployed to edge devices (Raspberry Pi, NVIDIA Jetson)
- **Desktop App**: Built as native installers for Windows, macOS, Linux

See the root [README.md](../README.md) and [DEPLOYMENT.md](../DEPLOYMENT.md)
for detailed deployment instructions.

## Architecture

The applications follow a modular architecture:

- **Frontend**: React-based web applications (Next.js, Docusaurus)
- **Backend**: Rust services for performance and safety
- **Edge**: Python for flexibility and ML integration
- **Desktop**: Rust + Web technologies via Tauri

All applications share common packages and crates from the monorepo root:

- `packages/` - Shared TypeScript packages
- `crates/` - Shared Rust crates

## Contributing

When adding new applications:

1. Create a new directory under `apps/`
2. Add a `README.md` with application-specific documentation
3. Update this `apps/README.md` with the new application
4. Update the root `README.md` structure section
5. Add appropriate build/deploy configurations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
