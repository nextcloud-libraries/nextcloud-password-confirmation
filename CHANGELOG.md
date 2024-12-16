# Changelog
All notable changes to this project will be documented in this file.

<!--
 - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

## 5.3.1 - 2024-12-16

### What's Changed

### Fixes

* fix: Improve pwd confirmation condition #906 by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/906

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.3.0...v5.3.1

## 5.3.0 - 2024-11-27

### What's Changed

### Fixes

* fix: Use spawnDialog from @nc/dialogs #895  by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/895

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.2.0...v5.3.0

## 5.2.0 - 2024-11-27

### What's Changed

### Features

* feat: Expose axios interceptors by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/881

### Dependencies

* chore(deps): Bump skjnldsv/read-package-engines-version-actions to 3
* chore(deps): Bump actions/setup-node to 4.1.0
* chore(deps): Bump axios to 1.7.4
* chore(deps): Bump @nextcloud/axios to 2.5.1
* chore(deps): Bump pascalgn/automerge-action to 0.16.4
* chore(deps): Bump rollup to 4.22.4
* chore(deps): Bump actions/checkout to 4.2.2
* chore(deps): Bump dompurify to 3.1.7

### Development dependencies

* chore(deps-dev): Bump @types/node to 20.14.12
* chore(deps-dev): Bump vite to 5.4.11
* chore(deps-dev): Bump typescript to 5.7.2
* chore(deps-dev): Bump sass to 1.81.0
* chore(deps-dev): Bump @nextcloud/vite-config to 1.4.2
* chore(deps-dev): Bump elliptic to 6.6.0

### Miscellaneous

* chore: Add SPDX license headers by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/805
* Migrate REUSE to TOML by @AndyScherzinger in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/815
* Updates for project Nextcloud password confirmation library by @transifex-integration in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/807
* CI. Update dependabot-approve-merge.yml by @AndyScherzinger in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/843

### New Contributors

* @AndyScherzinger made their first contribution in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/815
* @artonge made their first contribution in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/881

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.1.1...v5.2.0

## 5.1.1 - 2024-06-25
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.1.0...v5.1.1)

### Fixed
* fix: Correctly export Typescript types in `exports` [\#795](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/795)

### Changed
* Updated translations
* chore(deps): Bump @nextcloud/router to 3.0.1
* chore(deps): Bump @nextcloud/axios to 2.5.0
* chore(deps): Bump @nextcloud/l10n to 3.1.0
* chore(dev-deps): Update development dependencies [\#794](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/794)
* chore: Update workflows from organization [\#797](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/797)

## 5.1.0 - 2024-03-22
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.0.1...v5.1.0

### Added
* enh: Migrate to NcDialog by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/697
* enh: Compress translations to reduce bundle size by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/698

### Fixed
* fix: Adjust code indention to be consistent (tabs) by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/692
* fix: Do not translate Exception error message by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/691
* fix: Adjust peer dependency on `@nextcloud/vue` to allow stable version by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/693

### Changed
* Updated translations
* Updated `@nextcloud/router` to 3.0.0
* Updated development dependencies
* Update NPM to v10 to align with the version provided by LTS Node 20
* Make package ESM by default by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/696

## 5.0.1 - 2023-11-28

### Fixed

- fix: do not mount to hidden modal by @ShGKme in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/666
- build: fix dev and watch build by specifying CSS chunk path by @ShGKme in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/667

### Changed

- Setup for Transifex by @ShGKme in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/634
- Dependency updates

## 5.0.0 - 2023-10-09

### Fixed

- Improve password confirmation dialog design and accessibility

### Changed

- Major update `@nextcloud/vue` to v8.0.0-beta.7

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
