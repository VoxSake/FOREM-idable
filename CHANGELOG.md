# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-27

### Changed
- Replaced SVG branding logo with a text wordmark using `Space Grotesk`, with theme-aware colors for light/dark mode.
- Reworked offer comparison into an unlimited offer selection flow.
- Replaced the action icon with a checkbox-only selector in the jobs table.
- Updated export scope naming from `compare` to `selected` and UI labels to `Sélection`.

### Removed
- Removed `public/forem-idable-logo-light.svg` and `public/forem-idable-logo-dark.svg`.

### Refactored
- Renamed selection-related code paths from `compare` terminology to `selection`:
  - `ComparePanel` -> `SelectionPanel`
  - `useCompareJobs` -> `useSelectionJobs`
  - `toggleCompareJobs` -> `toggleSelectionJob`
  - related variables/imports/tests updated accordingly.
