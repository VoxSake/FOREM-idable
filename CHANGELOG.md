# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-03-01

### Added
- Added optional Umami analytics integration controlled by environment variables.
- Added Umami configuration examples to `env.example` and setup steps in `README.md`.
- Added coach/admin calendar subscription feeds for interviews, with per-group and global beneficiary sync URLs.
- Added coach calendar help copy and more compact action menus across coach and applications interfaces.
- Added coach CSV import for beneficiary follow-up with column auto-detection, manual mapping, status correction, duplicate handling and date format selection.
- Added coach dashboard sections for priorities and recent activity.
- Added coach-side candidate application editing and deletion directly from each application block in the beneficiary side panel.

### Fixed
- Removed React Compiler/TanStack compatibility lint warning in `JobTable` with a targeted rule suppression.
- Fixed applications sorting so equal sent dates are tie-broken by most recent update time.
- Fixed desktop job table width balance and date/actions overlap.
- Fixed mobile overflow in the applications header actions bar.
- Fixed group calendar feeds so standard-group members with role `admin` are included when explicitly assigned.
- Fixed the coach CSV import dialog layout on long forms and clarified duplicate/file messaging.
- Fixed CSV template UTF-8 encoding so accented headers open correctly in Excel.

### Changed
- Replaced SVG branding logo with a text wordmark using `Space Grotesk`, with theme-aware colors for light/dark mode.
- Reworked offer comparison into an unlimited offer selection flow.
- Replaced the action icon with a checkbox-only selector in the jobs table.
- Updated export scope naming from `compare` to `selected` and UI labels to `Sélection`.
- Matched the applications details sheet width to the wider coach side panel.
- Restricted calendar link regeneration to admins while keeping link copy available to coaches and admins.
- Updated the coach application management flow to apply edits and deletions locally without reloading the full dashboard.

### Removed
- Removed `public/forem-idable-logo-light.svg` and `public/forem-idable-logo-dark.svg`.

### Refactored
- Renamed selection-related code paths from `compare` terminology to `selection`:
  - `ComparePanel` -> `SelectionPanel`
  - `useCompareJobs` -> `useSelectionJobs`
  - `toggleCompareJobs` -> `toggleSelectionJob`
  - related variables/imports/tests updated accordingly.
