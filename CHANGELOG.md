# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/cfware/babel-plugin-bare-import-rewrite/compare/v1.5.1...v2.0.0) (2020-01-26)


### ⚠ BREAKING CHANGES

* bump requirement to node.js 10.13.0
* The `modulesDir` no longer defaults to `/node_modules`.

### Features

* Add preserveSymlinks option ([eb4b2b4](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/eb4b2b451f157e3123a49cf9c739390ccfe27ad6)), closes [#23](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/23)
* bump requirement to node.js 10.13.0 ([8dbab86](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/8dbab868fd7a4bb34c162071e1e9ca26545bace4))
* Create processAtProgramExit option ([#30](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/30)) ([ad99be5](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/ad99be55f15896277d8b85c05bddf63528f8439b)), closes [#26](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/26)
* Use relative path to node_modules by default ([#22](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/22)) ([f9eaf0e](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/f9eaf0e10c4c16ab8578baf335908eb213757552))


### Bug Fixes

* modulesDir default should be absolute FS path when fsPath is enabled ([6f299bc](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/6f299bc31dc9c2f0341d3ccf8295631ef88b957c))

### [1.5.1](https://github.com/cfware/babel-plugin-bare-import-rewrite/compare/v1.5.0...v1.5.1) (2019-06-06)



# [1.5.0](https://github.com/cfware/babel-plugin-bare-import-rewrite/compare/v1.4.0...v1.5.0) (2019-04-16)


### Features

* add resolveDirectories option ([#16](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/16)) ([d648fc7](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/d648fc7))



# [1.4.0](https://github.com/cfware/babel-plugin-bare-import-rewrite/compare/v1.3.2...v1.4.0) (2019-04-14)


### Features

* add failOnUnresolved option ([#15](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/15)) ([b0a18ec](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/b0a18ec))



## [1.3.2](https://github.com/cfware/babel-plugin-bare-import-rewrite/compare/v1.3.1...v1.3.2) (2019-04-05)


### Bug Fixes

* **package:** update arrify to version 2.0.0 ([#12](https://github.com/cfware/babel-plugin-bare-import-rewrite/issues/12)) ([109d89f](https://github.com/cfware/babel-plugin-bare-import-rewrite/commit/109d89f))
