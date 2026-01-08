# Changelog

All notable changes to the PhoenixRooivalk project will be documented in this
file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Infrastructure

- **BREAKING**: Remove all Netlify references - project now deploys exclusively
  to Azure Static Web Apps
  - Removed Netlify badges and deployment status from README.md
  - Deleted `apps/docs/netlify.toml` configuration file
  - Updated all hardcoded `netlify.app` URLs to use environment variables or
    placeholders
  - Updated marketing site metadata to use `NEXT_PUBLIC_SITE_URL` environment
    variable
  - Updated docs site to use `DOCS_URL` and `MARKETING_URL` environment
    variables
  - Updated Analytics component to use `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
    environment variable
  - Removed Netlify form attributes from contact page (data-netlify,
    netlify-honeypot)
  - Updated sitemap.xml and robots.txt to use placeholder URLs
  - Updated \_redirects file with Azure Static Web Apps note
  - Updated pitch deck to reference Azure deployment
  - Updated documentation to reflect Azure-only deployment

---

## [Unreleased] - Week 48 (Nov 25 - Dec 1, 2025)

### Documentation Platform

#### PDF Download & Slide Deck Components

- **feat(docs)**: Add PDF download and slide deck generation for progress
  reports ([#214](https://github.com/JustAGhosT/PhoenixRooivalk/pull/214))
- **feat(docs)**: Add inline SlideDeck and SlideSection components with
  integrated download button
- **feat(docs)**: Add print-to-PDF functionality with title page and print
  styles
- **fix(docs)**: Register SlideDeck components in MDXComponents for MDX support
  ([#216](https://github.com/JustAGhosT/PhoenixRooivalk/pull/216))
- **fix(docs)**: Fix download components to use CSS modules instead of Tailwind

#### Week 48 Progress Report

- **docs**: Add x402 Revenue Model as slide 6 in investor presentation
  ([#217](https://github.com/JustAGhosT/PhoenixRooivalk/pull/217))
- **docs**: Expand x402 slide with concrete market examples (insurance, legal,
  regulatory)
- **docs**: Add x402/Solana discussion point for investor meeting

#### Layout & UI Improvements

- **style(docs)**: Compact TOC sidebar and center content
  ([#218](https://github.com/JustAGhosT/PhoenixRooivalk/pull/218))
- **feat(docs)**: Improve homepage design and add auth debugging
  ([#219](https://github.com/JustAGhosT/PhoenixRooivalk/pull/219))
- **fix(docs)**: Remove duplicate header on documentation home page
- **fix(docs)**: Remove invalid colorMode navbar item and move GitHub to footer
- **refactor(docs)**: Move GitHub to footer and add social links

#### Build & Infrastructure

- **fix(docs)**: Use pnpm instead of npm in netlify.toml
- **chore**: Clean up root directory docs (delete obsolete pitch deck files,
  move DEPLOYMENT.md)

---

## [Previous] - November 14-24, 2025

This release includes major feature additions across AI/RAG integration, x402
payment protocol, documentation platform improvements, and infrastructure
enhancements.

---

## Part 1: Major Features

### x402 Payment Protocol

- **feat(x402)**: Implement x402 payment protocol for premium evidence
  verification ([#197](https://github.com/JustAGhosT/PhoenixRooivalk/pull/197))
- **feat(x402)**: Add rate limiting for premium verification endpoints
- **feat(api)**: Add database-agnostic unique constraint violation detection
- **fix**: Enable SQLite extended result codes and tighten unique constraint
  detection
- **fix**: Add Bearer token auth header to x402 tests for M2M endpoint
- **refactor(tests)**: Extract test Bearer token to constant for maintainability
- **fix**: Resolve clippy warnings in x402 crate
- **docs(adr)**: Add ADR 0016 for x402 payment protocol

### AI Features & RAG Integration

- **feat(functions)**: Integrate RAG across all AI functions
  ([#188](https://github.com/JustAGhosT/PhoenixRooivalk/pull/188))
- **feat(functions)**: Add centralized prompt management system with ADRs
- **feat(functions)**: Add researchPerson Cloud Function for AI fun facts
- **feat**: Add integrated AI chat interface with conversation memory
- **feat**: Implement RAG functions and Ask Docs tab for AI Panel
- **feat**: Add comprehensive AI features with OpenAI integration
- **feat**: Implement Azure AI Search integration for Phase 3 vector database
- **feat**: Implement Phase 2 Infrastructure improvements - Azure AI provider,
  caching, and monitoring
- **docs**: Add comprehensive RAG integration strategies and implementation
  guide

### User Profiles & Onboarding

- **feat(docs)**: Add user profiles, profile confirmation, and onboarding
  walkthrough ([#187](https://github.com/JustAGhosT/PhoenixRooivalk/pull/187))
- **feat(docs)**: Add profile completion and AI fun facts to onboarding flow
- **feat(docs)**: Phase 3 - profile settings page and unknown user support
- **feat(docs)**: Persist user profile data to Firebase
- **feat(onboarding)**: Fully implement step variable in handlePrevious
- **fix(auth)**: Merge Firestore profile data with localStorage on login

### Gamification & Progress Tracking

- **feat(docs)**: Add gamification system and PDF export
- **feat(docs)**: Add completion toast, fix flicker, collapse sidebar, AI
  recommendations
- **feat**: Integrate gamification system with Firebase cloud sync
- **feat**: Implement infrastructure for gamification frontmatter metadata
- **feat**: Add gamification frontmatter to all documentation files
- **feat**: Add user time tracking to documentation progress
- **feat(docs)**: Add Firebase cloud sync for cross-device progress

---

## Part 2: Documentation & Architecture

### Architecture Decision Records (ADRs)

- **docs(adr)**: Add ADR-0000 management framework with Cognitive Mesh
  integration
- **docs(adr)**: Add ADRs for advanced AI features (0019-0023)
- **docs(adr)**: Add ADR-0018 for LangChain integration strategy
- **docs(adr)**: Add ADR 0015 for Movement Network integration evaluation
- **docs(adr)**: Add ADR 0016 for x402 payment protocol
- **docs**: Refactor ADR-0011 + add ADR-0012/0013/0014 for rFunctions and Auth
- **docs**: Add ADR 0011 for Vector Database Selection - recommending Firebase
  Vector Search
- **docs**: Add weighted comparison appendices for ADR-0012, ADR-0013, ADR-0014
- **docs**: Add Azure deployment alternatives to ADR-0011 (Container Apps, AKS,
  Cosmos DB, pgvector, Assistants API)
- **docs(architecture)**: Add AI implementation roadmap

### Documentation Site Improvements

- **feat**: Improve documentation navigation structure
  ([#177](https://github.com/JustAGhosT/PhoenixRooivalk/pull/177))
- **feat**: Standardize figures across documentation
- **feat**: Simplify navbar for cleaner navigation
- **feat**: Restore Your Progress functionality with better placement
- **feat(docs)**: Improve documentation link checking and fix broken links
- **docs**: Enable broken link warnings and add category configurations
- **docs**: Improve code quality and add missing research docs to sidebar
- **feat**: Create investment-phases.md documentation

### sUAS Program Documentation

- **docs**: Add DHS sUAS Program Documentation and recommendations
  ([#170](https://github.com/JustAGhosT/PhoenixRooivalk/pull/170))
- **docs**: Add market intelligence notes from Drone & Sundry video
- **docs**: Add drone training data guide and influencers/contacts document
- **docs**: Add defense competitions and preserve development ADRs
- **docs**: Expand influencers with veteran/geopolitics channels
- **docs**: Consolidate duplicate sUAS documentation sections

### Business Materials

- **feat**: Install Marp CLI and enhance pitch deck with visual charts, dates,
  and exit strategy
- **docs**: Add pitch deck completion summary and documentation
- **docs**: Create comprehensive investor pitch deck with supporting materials

---

## Part 3: Authentication & Security

### Firebase Authentication

- **feat**: Add authentication gating, analytics tracking, and conversion
  funnels
- **1913870**: Require authentication for all documentation pages, only landing
  page is public
- **fix**: Address code review issues and add Firestore security rules
- **fix**: Address code review feedback on firestore rules and sqlx error
  handling

### Security Improvements

- **d3535e9**: Add CSRF/M2M protection to verify_evidence_premium handler
- **fix**: Improve shell script quality and add IP extraction security docs
- **fix**: Address code review feedback on shell compatibility

### Error Handling

- **d931fd8**: Improve Firebase configuration error message with specific
  missing variables
- **docs**: Improve db_errors documentation and deployment guide clarity

---

## Part 4: UI/UX Improvements

### Documentation UI

- **feat(docs)**: Add easy enhancements for better UX
- **feat(docs)**: Add medium-complexity enhancements
- **feat**: Add error boundaries for resilient documentation site
- **fix**: Fix table and CTA buttons centering, hide Progress link when not
  logged in
- **fix**: Address code review feedback: improve browser compatibility and
  simplify CSS

### Navbar & Login

- **feat**: Add login button to docs navbar, fix hero colors to match main site,
  add version to footer
  ([#209](https://github.com/JustAGhosT/PhoenixRooivalk/pull/209))
- **fix**: Fix Firebase config to use Docusaurus customFields and fix CSS module
  imports

### Theme & Styling

- **feat**: Implement 3-way theme toggle and improve UI consistency
  ([#152](https://github.com/JustAGhosT/PhoenixRooivalk/pull/152))

### WASM Threat Simulator

- **feat(wasm-threat-simulator)**: Adopt iframe isolation, add error boundary
  wrappers, and enhance feed
- **feat**: Add Evidence Explorer UI and docs

---

## Part 5: Infrastructure & DevOps

### Cloud Functions

- **feat**: Add Cloud Functions deployment pipeline and GA4 integration
- **feat**: Add Cloud Functions for data retention
- **fix**: Remove npm cache config from deploy-functions workflow

### Testing Infrastructure

- **feat**: Add Jest testing infrastructure and initial tests
- **fix**: Add mutex locks to serialize tests with env var dependencies
- **fix(ui)**: Add @testing-library/dom as dev dependency to fix TypeScript
  errors

### Analytics & Tracking

- **feat(wave-1)**: Add GDPR-compliant cookie consent for analytics
- **feat**: Add client-side rate limiting for analytics

### Offline Support

- **feat**: Add offline support with sync queue

---

## Part 6: Bug Fixes

### Code Quality

- **fix**: Use is_some_and instead of map_or for clippy compliance
- **fix**: Address multiple code review issues across codebase
- **fix**: Add blank lines around lists in docs README to fix MD032 lint
- **fix**: Address code review feedback - use real digest and gate legal
  attestation
- **style**: Fix cargo fmt formatting issues in db_errors.rs and
  handlers_x402.rs

### Documentation Fixes

- **fix**: Resolve TypeScript errors and broken link in documentation
- **fix**: Update broken documentation links to use Docusaurus format
- **fix**: Apply Prettier formatting to documentation files
- **fix**: Resolve MD042 empty links and disable MD060 table alignment rule
- **fix**: Remove broken sensor-fusion.md links and empty ICS file hrefs
- **fix**: Fix broken links, rename Glossary.md, remove empty file
- **fix**: Fix broken Docusaurus links by removing .md extensions from internal
  links

### Build & Dependencies

- **fix**: Sync pnpm lockfile with package.json by updating @types/react
  overrides
- **fix**: Update pnpm-lock.yaml to include @testing-library/dom
- **fix**: Update pnpm-lock.yaml to match package.json dependencies
- **fix**: Resolve broken pnpm lockfile by regenerating with
  --no-frozen-lockfile

### UI Fixes

- **fix(onboarding)**: Improve handlePrevious comments and simplify highlight
  cleanup
- **fix(docs)**: Additional bug fixes and UX improvements
- **fix(docs)**: Phase 1 bug fixes for profile and recommendations
- **fix**: Correct weighted score calculations in ADR appendices
- **fix**: Address code review - populate azureStats and unify
  VectorSearchResult interface
- **fix**: Address code review feedback for AI chat components
- **refactor**: Improve RAG code maintainability based on code review

---

## Part 7: Dependencies

### Dependabot Updates (Nov 24, 2025)

- **deps**: Bump leptos from 0.8.12 to 0.8.13
- **deps**: Bump clap from 4.5.52 to 4.5.53
- **deps(deps-dev)**: Bump @types/react from 18.3.3 to 19.2.7
- **deps(deps-dev)**: Bump @types/react-dom from 18.3.0 to 19.2.3
- **deps(deps-dev)**: Bump lint-staged from 16.2.6 to 16.2.7
- **deps(deps-dev)**: Bump markdownlint-cli from 0.45.0 to 0.46.0
- **deps(deps-dev)**: Bump markdownlint-cli2 from 0.19.0 to 0.19.1
- **ci(deps)**: Bump actions/checkout from 5 to 6

---

## Part 8: Refactoring

### Code Improvements

- **refactor(docs)**: Split profile templates into separate files and enhance
  onboarding
- **refactor(docs)**: Phase 2 - centralize profile state in AuthContext
- **refactor(x402)**: Improve state management, add payment receipts, fix test
  leaks
- **refactor**: Improve RAG code maintainability based on code review
- **refactor**: Extract score extraction into helper function
- **refactor(tests)**: Extract test Bearer token to constant for maintainability
- **refactor**: Improve naming and consolidate duplicated patterns in Rust code

### Style Fixes

- **style**: Fix Prettier formatting in apps/docs config files
- **style**: Fix Prettier formatting issues across 32 files
- **style**: Reorder JSX import after React imports for better organization
- **style**: Fix cargo fmt formatting issues

---

## Summary Statistics

- **Total Commits**: 370+
- **Pull Requests Merged**: 40+
- **New ADRs**: 10+ (ADR-0011 through ADR-0023)
- **Major Features**: x402 Payment Protocol, RAG Integration, User Profiles,
  Gamification
- **Date Range**: November 14-28, 2025

---

## Contributors

- Claude (AI Assistant)
- Copilot SWE Agent
- Dependabot
- Jurie Smit
- Engine Labs App

---

[Unreleased]: https://github.com/JustAGhosT/PhoenixRooivalk/compare/main...HEAD
