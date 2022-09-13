# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Breaking

- Dialog styles must be imported with `import '@nextcloud/password-confirmation/dist/style.css'`

### Fixed

- Remove exports field to fix eslint and build errors in dependent environments

## 3.0.1 - 2022-09-12

### Fixed

- Fix dialog not appearing when another modal is open

## 3.0.0 - 2022-09-07

### Breaking

- Default export has been dropped, the function must now be imported with `import { confirmPassword } from '@nextcloud/password-confirmation'`
- Dialog styles must be imported with `import '@nextcloud/password-confirmation/style.css'`

### Changed

- Core password confirmation logic and dialog markup has been ported to this package where previously this package was a thin wrapper over the `OC.PasswordConfirmation` global js namespace
- Use https://github.com/vitejs/vite as the build system
- Drop Babel toolchain
- Add translation files
- Add GitHub workflows
- Dependency updates

## 2.0.0 - 2021-11-30

### Added

- Rewrite in Typescript and provide Typescript typings
- Dependency updates

## 1.1.0 - 2021-11-02
### Changed
- Updated to Nextcloud's browserslist config v2
- Dependency updates

## 1.0.1 - 2020-04-07
### Changed
- Dependency updates
### Fixed
- Update vulnerable packages
