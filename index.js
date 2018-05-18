'use strict';

const path = require('path');

const syntax = require('@babel/plugin-syntax-dynamic-import');
const whatwgUrl = require('whatwg-url');
const resolve = require('resolve');
const pathIsInside = require('path-is-inside');
const isWindows = require('is-windows');

const isPathSpecifier = str => /^\.{0,2}\//.test(str);

function tryResolve(importPath, parserOpts, pluginOptions) {
	if (whatwgUrl.parseURL(importPath) !== null) {
		return importPath;
	}

	const {sourceFileName} = parserOpts;

	try {
		const basedir = path.dirname(sourceFileName);
		const importPathAbs = resolve.sync(importPath, {
			basedir,
			/*
			 * It's invalid to load a .json or .node file as a module on the web,
			 * but this is what Node's resolution algorithm does
			 * (https://nodejs.org/api/modules.html#modules_all_together), so we
			 * also do it here for completeness. Without including these
			 * extensions the user will probably get a 404. With them, they'll
			 * probably get an invalid MIME type error (which is hopefully more
			 * useful).
			*/
			extensions: ['.js', '.json', '.node'],
			/* Some packages use a non-standard alternative to the "main" field
			 * in their package.json to differentiate their ES module version. */
			packageFilter(packageJson) {
				packageJson.main = packageJson.module ||
					packageJson['jsnext:main'] || packageJson.main;
				return packageJson;
			},
		});

		const nodeModules = path.resolve('node_modules');
		const isNodeModule = pathIsInside(importPathAbs, nodeModules);
		const fromNodeModule = pathIsInside(path.resolve(sourceFileName), nodeModules);
		let importPathRel = path.relative(basedir, importPathAbs);

		if (isNodeModule && !fromNodeModule) {
			importPathRel = path.join(
				pluginOptions.modulesDir || '/node_modules',
				path.relative(nodeModules, importPathAbs));
		}
		/* istanbul ignore if */
		if (isWindows()) {
			/* Normalize path separators to URL format */
			importPathRel = importPathRel.replace(/\\/g, '/');
		}
		if (!isPathSpecifier(importPathRel)) {
			importPathRel = './' + importPathRel;
		}

		return importPathRel;
	} catch (e) {
		console.error(`Could not resolve '${importPath}' in file '${sourceFileName}'.`);
		return importPath;
	}
}

module.exports = () => ({
	inherits: syntax.default,
	visitor: {
		CallExpression(path, {opts}) {
			if (path.node.callee.type !== 'Import') {
				return;
			}

			const [source] = path.node.arguments;
			if (source.type !== 'StringLiteral') {
				/* Should never happen */
				return;
			}

			source.value = tryResolve(source.value, path.hub.file.opts.parserOpts, opts);
		},
		'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(path, {opts}) {
			const {source} = path.node;

			// An export without a 'from' clause
			if (source === null) {
				return;
			}

			source.value = tryResolve(source.value, path.hub.file.opts.parserOpts, opts);
		},
	},
});
