# Changelog
All notable changes to this project will be documented in this file.

<!--
 - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

## [6.0.2](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v6.0.1...v6.0.2) - 2025-11-06
### Fixed
* fix: add check for validatePromise for passwordless environments [\#1209](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1209) \([benjaminfrueh](https://github.com/benjaminfrueh)\)

### Changed
* docs: adjust supported versions [\#1176](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1176) \([susnux](https://github.com/susnux)\)
* refactor: use css modules and script-setup [\#1174](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1174) \([susnux](https://github.com/susnux)\)

## [6.0.1](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v6.0.0...v6.0.1) - 2025-10-16
### Fixed
* fix: ensure password is used for axios request [\#1172](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1172) \([susnux](https://github.com/susnux)\)

### Changed
* ci: add workflow to block unconventional commits [\#1175](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1175) \([susnux](https://github.com/susnux)\)
* Updated translations

## [6.0.0](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.3.1...v6.0.0) - 2025-09-28
### Notes

This package now builds on top of `@nextcloud/vue` version 9 using Vue 3.
While this package uses Vue 3 it is also possible to use it within a Vue 2 project,
in this case the Vue dependency will not be shared as the dependency was moved from a peer dependency to a plain dependency.
This also means that if you are using Vue 2 you have to ensure you do not use bundler
configurations that enforce resolving Vue to the same version as this will fail now,
instead let the bundler choose the matching Vue version.

For example if using Webpack this will no longer work in **Vue 2** apps:
```js
  resolve: {
                alias: {
                        vue$: path.resolve('./node_modules/vue'),
                },
  }
```

For Vue 3 apps nothing changed, meaning the app and this library will share the same Vue dependency as long as the versions are compatible.

### Breaking

* This package now uses Vue 3 internally.
* The legacy common js entry point is removed.
* The legacy, deprecated, `dist/style.css` entry point was removed. If you still use it please adjust as following:
```diff
- import '@nextcloud/password-confirmation/dist/style.css'
+ import '@nextcloud/password-confirmation/style.css'
```

### Fixed
* fix: Differentiate non-403 errors by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1104

### Changed
* chore: drop unneeded TS declarations by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/1020
* Updated translations

## 5.3.1 - 2024-12-16
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.3.0...v5.3.1)

### Fixed
* fix: Improve pwd confirmation condition #906 by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/906

## 5.3.0 - 2024-11-27
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.2.0...v5.3.0)

### Fixed
* fix: Use spawnDialog from @nc/dialogs #895  by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/895

## 5.2.0 - 2024-11-27
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/compare/v5.1.1...v5.2.0)

### Added
* feat: Expose axios interceptors by @artonge in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/881

### Changed
* chore: Add SPDX license headers by @susnux in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/805
* Migrate REUSE to TOML by @AndyScherzinger in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/815
* Updates for project Nextcloud password confirmation library by @transifex-integration in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/807
* CI. Update dependabot-approve-merge.yml by @AndyScherzinger in https://github.com/nextcloud-libraries/nextcloud-password-confirmation/pull/843
* chore(deps): Bump skjnldsv/read-package-engines-version-actions to 3
* chore(deps): Bump actions/setup-node to 4.1.0
* chore(deps): Bump axios to 1.7.4
* chore(deps): Bump @nextcloud/axios to 2.5.1
* chore(deps): Bump pascalgn/automerge-action to 0.16.4
* chore(deps): Bump rollup to 4.22.4
* chore(deps): Bump actions/checkout to 4.2.2
* chore(deps): Bump dompurify to 3.1.7

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
