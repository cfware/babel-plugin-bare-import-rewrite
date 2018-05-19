# babel-plugin-bare-import-rewrite

[![Travis CI][travis-image]][travis-url]
[![Greenkeeper badge][gk-image]](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![BSD-3-Clause][license-image]](LICENSE)

Babel plugin to rewrite bare imports.  In theory this will become obsolete if/when
browsers get support for import maps.  See [domenic/package-name-maps] for information
about the proposal.

### Install babel-plugin-bare-import-rewrite

This module requires node.js 8 or above and `@babel/core`.

```sh
npm i babel-plugin-bare-import-rewrite
```

## Usage

Add `bare-import-rewrite` to `plugins` in your babel settings.

## Settings

```json
{
	"plugins": [
		["bare-import-rewrite", {
			"modulesDir": "/node_modules"
		}]
	]
}
```

`modulesDir` sets the web path which modules will be published from the web server.
This must always be an absolute directory.  Default "/node_modules".

The plugin settings object can be omitted if defaults are used:
```json
{
	"plugins": ["bare-import-rewrite"]
}
```

## Running tests

Tests are provided by xo and ava.

```sh
npm install
npm test
```

## Attribution

This module is based on code found in [polymer-build] and [polymer-analyzer].

[npm-image]: https://img.shields.io/npm/v/babel-plugin-bare-import-rewrite.svg
[npm-url]: https://npmjs.org/package/babel-plugin-bare-import-rewrite
[travis-image]: https://travis-ci.org/cfware/babel-plugin-bare-import-rewrite.svg?branch=master
[travis-url]: https://travis-ci.org/cfware/babel-plugin-bare-import-rewrite
[gk-image]: https://badges.greenkeeper.io/cfware/babel-plugin-bare-import-rewrite.svg
[downloads-image]: https://img.shields.io/npm/dm/babel-plugin-bare-import-rewrite.svg
[downloads-url]: https://npmjs.org/package/babel-plugin-bare-import-rewrite
[license-image]: https://img.shields.io/github/license/cfware/babel-plugin-bare-import-rewrite.svg
[domenic/package-name-maps]: https://github.com/domenic/package-name-maps/
[polymer-analyzer]: https://github.com/Polymer/tools/blob/219ab4f3f9f8773e75f8c6181109e8966082b9af/packages/analyzer/src/javascript/resolve-specifier-node.ts
[polymer-build]: https://github.com/Polymer/tools/blob/219ab4f3f9f8773e75f8c6181109e8966082b9af/packages/build/src/babel-plugin-bare-specifiers.ts
