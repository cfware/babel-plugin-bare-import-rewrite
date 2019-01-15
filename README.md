# babel-plugin-bare-import-rewrite

[![Travis CI][travis-image]][travis-url]
[![Greenkeeper badge][gk-image]](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![BSD-3-Clause][license-image]](LICENSE)

Babel plugin to rewrite bare imports.  In theory this will become obsolete if/when
browsers get support for import maps.  See [domenic/package-name-maps] for information
about the proposal.

## Install babel-plugin-bare-import-rewrite

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
			"modulesDir": "/node_modules",
			"rootBaseDir": ".",
			"alwaysRootImport": [],
			"ignorePrefixes": ["//"]
		}]
	]
}
```

If the plugin settings object is omitted the defaults are used:
```json
{
	"plugins": ["bare-import-rewrite"]
}
```

### modulesDir

The URL path in which `node_modules` will be published on the web server. This
must always be an absolute directory without hostname.  Default `"/node_modules"`.

### rootBaseDir

The project base directory.  This should contain the package.json and node_modules
of the application.  Default `process.cwd()`.

### alwaysRootImport

This contains a list of module bare names which should always be forced to import from
the root node_modules.  `['**']` can be used to specify that all modules should be
resolved from the root folder.  No attempt is made to verify that overridden modules
are compatible.  Each element is used as a pattern to be processed with `minimatch`.
Default `[]`.

### neverRootImport

This contains a list of module bare names which should never be forced to imported
from the root node_modules.  Processed with `minimatch`.  Default `[]`.

This example will force all modules to be loaded from the root node_modules except
for `some-exception`:
```json
{
	"alwaysRootImport": ["**"],
	"neverRootImport": ["some-exception"]
}
```

### fsPath

Setting this option `true` forces use of platform specific path separators.  This
should generally be used when using absolute filesystem paths for bundling.

### ignorePrefixes

This option can be set to an array of strings.  Each represents a module name prefix
to be ignored.

### extensions

A list of extensions to use in resolver. Default `['.mjs', '.js', '.json']`.

### `.resolve(importModule, sourceFileName, pluginOptions)` - Resolve absolute path.

This function is used internally by the babel plugin, is exposed so it can be used
by analyzers to build a list of scripts being imported.  The `pluginOptions` argument
takes the same values as the babel plugin and uses the same defaults.

```js
const {resolve} = require('babel-plugin-bare-import-rewrite');

const importModule = '@polymer/lit-element';
const pluginOptions = {
	"alwaysRootImport": ["@polymer/*"],
};
try {
	const absPath = resolve(importModule, __filename, pluginOptions);
	console.log(`The requested module ${importModule} is in ${absPath}.`);
} catch (e) {
	console.error(`Cound not resolve ${importModule}:`, e);
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
[license-image]: https://img.shields.io/npm/l/babel-plugin-bare-import-rewrite.svg
[domenic/package-name-maps]: https://github.com/domenic/package-name-maps/
[polymer-analyzer]: https://github.com/Polymer/tools/blob/219ab4f3f9f8773e75f8c6181109e8966082b9af/packages/analyzer/src/javascript/resolve-specifier-node.ts
[polymer-build]: https://github.com/Polymer/tools/blob/219ab4f3f9f8773e75f8c6181109e8966082b9af/packages/build/src/babel-plugin-bare-specifiers.ts
