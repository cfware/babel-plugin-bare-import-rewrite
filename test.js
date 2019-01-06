import path from 'path';
import test from 'ava';
import {transform} from '@babel/core';
import plugin from '.';

const nodeModules = path.resolve(__dirname, 'node_modules');

function babelTest(t, source, result, options = {}) {
	const origError = console.error;
	const expectErrors = [];
	const gotErrors = [];

	if (Array.isArray(options.expectErrors)) {
		expectErrors.push(...options.expectErrors);
		delete options.expectErrors;
	}
	t.context.gotErrors = [];
	console.error = (...msg) => {
		gotErrors.push(msg);
	};

	const {code} = transform(source, {
		filename: path.join(__dirname, 'file.js'),
		plugins: [plugin],
		...options,
	});

	t.deepEqual(gotErrors, expectErrors);
	t.is(code, result);
	console.error = origError;
}

test('exports', t => {
	t.is(typeof plugin, 'function');
	t.is(typeof plugin.resolve, 'function');
});

test('absolute resolve', t => {
	const rootIndex = path.resolve(__dirname, 'index.js');
	const fakeModule1 = path.join(__dirname, 'node_modules/@cfware/fake-module1/index.js');
	const fakeModule2 = path.join(__dirname, 'node_modules/@cfware/fake-module2/index.js');
	const fakeSubModule1 = path.join(path.dirname(fakeModule2), 'node_modules/@cfware/fake-module1/index.js');
	const isWindowsSub = path.join(path.dirname(fakeModule2), 'node_modules/is-windows/index.js');
	const isWindows = require.resolve('is-windows');

	/* URL's untouched */
	t.is(plugin.resolve('http://example.com/', rootIndex), 'http://example.com/');

	/* Find modules from root index.js */
	t.is(plugin.resolve('./test.js', rootIndex), path.resolve(__dirname, 'test.js'));
	t.is(plugin.resolve('@cfware/fake-module1', rootIndex), fakeModule1);
	t.is(plugin.resolve('@cfware/fake-module2', rootIndex), fakeModule2);

	/* Find submodule */
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2), fakeSubModule1);

	/* Avoid submodule */
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['@cfware/fake-module1']}), fakeModule1);
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['**']}), fakeModule1);

	/* Avoid submodules all except */
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2, {
		alwaysRootImport: ['**'],
		neverRootImport: ['@cfware/fake-module1'],
	}), fakeSubModule1);

	/* Avoid non-empty submodule list but not matching import */
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['@cfware/fake-module3']}), fakeSubModule1);

	/* Non-scoped module */
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['@cfware/fake-module1']}), isWindowsSub);
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['is-windows']}), isWindows);
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['**']}), isWindows);
});

test('static node package', t => babelTest(t,
	'import mod from "@cfware/fake-module1";',
	'import mod from "/node_modules/@cfware/fake-module1/index.js";'
));

test('static node subpackage', t => babelTest(t,
	'import mod from "@cfware/fake-module1";',
	'import mod from "./node_modules/@cfware/fake-module1/index.js";',
	{filename: 'node_modules/@cfware/fake-module2/index.js'}
));

test('static node ignore specific subpackage', t => babelTest(t,
	'import mod from "@cfware/fake-module1";',
	'import mod from "../fake-module1/index.js";',
	{
		filename: 'node_modules/@cfware/fake-module2/index.js',
		plugins: [[plugin, {
			alwaysRootImport: ['@cfware/fake-module1'],
		}]],
	}
));

test('static node ignore specific subpackage from subdir', t => babelTest(t,
	'import mod from "@cfware/fake-module1";',
	'import mod from "../../fake-module1/index.js";',
	{
		filename: 'node_modules/@cfware/fake-module2/subdir/index.js',
		plugins: [[plugin, {
			alwaysRootImport: ['@cfware/fake-module1'],
		}]],
	}
));

test('static node package to package', t => babelTest(t,
	'import mod from "is-windows";',
	'import mod from "../is-windows/index.js";',
	{filename: 'node_modules/path-is-inside/index.js'}
));

test('static node package with alternate location', t => babelTest(t,
	'import mod from "is-windows";',
	'import mod from "/assets/is-windows/index.js";',
	{plugins: [[plugin, {modulesDir: '/assets'}]]}
));

test('static node package to package with alternate location', t => babelTest(t,
	'import mod from "is-windows";',
	'import mod from "../is-windows/index.js";',
	{
		plugins: [[plugin, {modulesDir: '/assets'}]],
		filename: 'node_modules/path-is-inside/index.js',
	}
));

test('static node package to package with absolute path', t => babelTest(t,
	'import mod from "is-windows";',
	`import mod from "${path.join(nodeModules, 'is-windows', 'index.js').replace(/\\/g, '\\\\')}";`,
	{
		plugins: [[plugin, {modulesDir: nodeModules, fsPath: true}]],
		filename: 'index.js',
	}
));

test('static node package with full base URL, trailing slash', t => babelTest(t,
	'import mod from "is-windows";',
	'import mod from "https://example.com/node_modules/is-windows/index.js";',
	{plugins: [[plugin, {modulesDir: 'https://example.com/node_modules/'}]]}
));

test('static node package with full base URL, no trailing slash', t => babelTest(t,
	'import mod from "is-windows";',
	'import mod from "https://example.com/node_modules/is-windows/index.js";',
	{plugins: [[plugin, {modulesDir: 'https://example.com/node_modules'}]]}
));

test('static unresolved node package', t => babelTest(t,
	'import mod from "@cfware/this-module-will-never-exist";',
	'import mod from "@cfware/this-module-will-never-exist";',
	{expectErrors: [[`Could not resolve '@cfware/this-module-will-never-exist' in file '${path.join(__dirname, 'file.js')}'.`]]}
));

test('static http url', t => babelTest(t,
	'import mod from "http://example.com/";',
	'import mod from "http://example.com/";'
));

test('static current dir', t => babelTest(t,
	'import mod from ".";',
	'import mod from "./index.js";'
));

test('static parent dir', t => babelTest(t,
	'import mod from "..";',
	'import mod from "../index.js";',
	{filename: 'fixtures/file.js'}
));

test('export without from', t => babelTest(t,
	'export const id = "id".length();',
	'export const id = "id".length();'
));

test('dynamic current dir', t => babelTest(t,
	'const mod = import(".");',
	'const mod = import("./index.js");'
));

test('dynamic parent dir', t => babelTest(t,
	'const mod = import("..");',
	'const mod = import("../index.js");',
	{filename: 'fixtures/file.js'}
));

test('dynamic invalid', t => babelTest(t,
	'const mod = import(1);',
	'const mod = import(1);'
));
