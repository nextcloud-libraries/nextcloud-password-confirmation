# Changelog

All notable changes to this project will be documented in this file.

## 4.1.0 - 2023-10-09

### Added

- `isPasswordConfirmationRequired(): boolean` function to replace deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`

### Fixed

- Fix compatibility with `@nextcloud/l10n@^2`

### Changed

- Add `package.json/exports`
- Move to `nextcloud-libraries` organization
- Add ESLint for linting files
- Dependency updates

## 4.0.4 - 2023-02-15

### Fixed

- Do not import the entire vue library to fix package resolution errors

### Changed

- Dependency updates

## 4.0.3 - 2022-12-14

### Fixed

- Bump @nextcloud/vue to fix focus trap

## 4.0.2 - 2022-09-26

### Fixed

- Remove password policy checks completely to fix permanently disabled confirm button
- Bump @nextcloud/vue to remove errors from console

### Changed

- Document release process
- Dependency updates

## 4.0.1 - 2022-09-21

### Fixed

- Password strength shown

## 4.0.0 - 2022-09-14

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
