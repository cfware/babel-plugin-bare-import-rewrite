import path from 'path';
import test from 'ava';
import {transform} from '@babel/core';
import plugin from '../index.js';

const projectDir = path.resolve(__dirname, '..');
const nodeModules = path.resolve(projectDir, 'node_modules');
const nodeModulesRelative = path.join('.', 'node_modules');

function babelTest(t, {source, result, options = {}, expectErrors = []}) {
	const origError = console.error;
	const gotErrors = [];

	console.error = (...msg) => {
		gotErrors.push(msg);
	};

	try {
		const {code} = transform(source, {
			filename: path.join(projectDir, 'file.js'),
			plugins: [plugin],
			...options
		});

		t.deepEqual(gotErrors, expectErrors);
		t.is(code, result);
		console.error = origError;
	} catch (error) {
		if (options.plugins[0][1].failOnUnresolved) {
			t.true(error instanceof Error);
			return;
		}

		throw error;
	}
}

test('exports', t => {
	t.is(typeof plugin, 'function');
	t.is(typeof plugin.resolve, 'function');
});

test('absolute resolve', t => {
	const rootIndex = path.resolve(projectDir, 'index.js');
	const fakeModule1 = path.join(projectDir, 'node_modules/@cfware/fake-module1/index.js');
	const fakeModule2 = path.join(projectDir, 'node_modules/@cfware/fake-module2/index.js');
	const fakeSubModule1 = path.join(path.dirname(fakeModule2), 'node_modules/@cfware/fake-module1/index.js');
	const isWindowsSub = path.join(path.dirname(fakeModule2), 'node_modules/is-windows/index.js');
	const isWindows = require.resolve('is-windows');

	/* URL's untouched */
	t.is(plugin.resolve('http://example.com/', rootIndex), 'http://example.com/');

	/* Find modules from root index.js */
	t.is(plugin.resolve('./test/test.js', rootIndex), path.resolve(projectDir, 'test', 'test.js'));
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
		neverRootImport: ['@cfware/fake-module1']
	}), fakeSubModule1);

	/* Avoid non-empty submodule list but not matching import */
	t.is(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['@cfware/fake-module3']}), fakeSubModule1);

	/* Non-scoped module */
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['@cfware/fake-module1']}), isWindowsSub);
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['is-windows']}), isWindows);
	t.is(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['**']}), isWindows);
});

test('static node package', babelTest, {
	source: 'import mod from "@cfware/fake-module1";',
	result: 'import mod from "./node_modules/@cfware/fake-module1/index.js";'
});

test('static package from resolve directory A', babelTest, {
	source: 'import mod from "my-module/foo";',
	result: 'import mod from "./fixtures/my-modules/my-module/foo.js";',
	options: {
		plugins: [[plugin, {
			resolveDirectories: ['fixtures/my-modules', 'node_modules']
		}]]
	}
});

test('static package from resolve directory A imported by a file in resolve directory A', babelTest, {
	source: 'import mod from "my-module/foo";',
	result: 'import mod from "../my-module/foo.js";',
	options: {
		filename: 'fixtures/my-modules/my-other-module/foo.js',
		plugins: [[plugin, {
			resolveDirectories: ['fixtures/my-modules', 'node_modules']
		}]]
	}
});

test('static package from resolve directory B imported by a file in resolve directory A', babelTest, {
	source: 'import mod from "@cfware/fake-module1";',
	result: 'import mod from "../../../node_modules/@cfware/fake-module1/index.js";',
	options: {
		filename: 'fixtures/my-modules/my-other-module/foo.js',
		plugins: [[plugin, {
			resolveDirectories: ['fixtures/my-modules', 'node_modules']
		}]]
	}
});

test('static node subpackage', babelTest, {
	source: 'import mod from "@cfware/fake-module1";',
	result: 'import mod from "./node_modules/@cfware/fake-module1/index.js";',
	options: {filename: 'node_modules/@cfware/fake-module2/index.js'}
});

test('static node ignore specific subpackage', babelTest, {
	source: 'import mod from "@cfware/fake-module1";',
	result: 'import mod from "../fake-module1/index.js";',
	options: {
		filename: 'node_modules/@cfware/fake-module2/index.js',
		plugins: [[plugin, {
			alwaysRootImport: ['@cfware/fake-module1']
		}]]
	}
});

test('static node ignore specific subpackage from subdir', babelTest, {
	source: 'import mod from "@cfware/fake-module1";',
	result: 'import mod from "../../fake-module1/index.js";',
	options: {
		filename: 'node_modules/@cfware/fake-module2/subdir/index.js',
		plugins: [[plugin, {
			alwaysRootImport: ['@cfware/fake-module1']
		}]]
	}
});

test('static node package to package', babelTest, {
	source: 'import mod from "is-windows";',
	result: 'import mod from "../is-windows/index.js";',
	options: {filename: 'node_modules/path-is-inside/index.js'}
});

test('static node package with alternate location', babelTest, {
	source: 'import mod from "is-windows";',
	result: 'import mod from "/assets/is-windows/index.js";',
	options: {plugins: [[plugin, {modulesDir: '/assets'}]]}
});

test('static node package to package with alternate location', babelTest, {
	source: 'import mod from "is-windows";',
	result: 'import mod from "../is-windows/index.js";',
	options: {
		plugins: [[plugin, {modulesDir: '/assets'}]],
		filename: 'node_modules/path-is-inside/index.js'
	}
});

test('static node package to package with absolute path', babelTest, {
	source: 'import mod from "is-windows";',
	result: `import mod from "${path.join(nodeModules, 'is-windows', 'index.js').replace(/\\/g, '\\\\')}";`,
	options: {
		plugins: [[plugin, {modulesDir: nodeModules, fsPath: true}]],
		filename: 'index.js'
	}
});

test('static node package to package with fsPath but no modulesDir specified', babelTest, {
	source: 'import mod from "is-windows";',
	result: `import mod from ".${(path.sep + path.join(nodeModulesRelative, 'is-windows', 'index.js')).replace(/\\/g, '\\\\')}";`,
	options: {
		plugins: [[plugin, {fsPath: true}]],
		filename: 'index.js'
	}
});

test('static node package with full base URL, trailing slash', babelTest, {
	source: 'import mod from "is-windows";',
	result: 'import mod from "https://example.com/node_modules/is-windows/index.js";',
	options: {plugins: [[plugin, {modulesDir: 'https://example.com/node_modules/'}]]}
});

test('static node package with full base URL, no trailing slash', babelTest, {
	source: 'import mod from "is-windows";',
	result: 'import mod from "https://example.com/node_modules/is-windows/index.js";',
	options: {plugins: [[plugin, {modulesDir: 'https://example.com/node_modules'}]]}
});

test('static unresolved node package', babelTest, {
	source: 'import mod from "@cfware/this-module-will-never-exist";',
	result: 'import mod from "@cfware/this-module-will-never-exist";',
	expectErrors: [
		[`Could not resolve '@cfware/this-module-will-never-exist' in file '${path.join(projectDir, 'file.js')}'.`]
	]
});

test('static unresolved node package, failOnUnresolved', babelTest, {
	source: 'import mod from "@cfware/this-module-will-never-exist";',
	result: 'import mod from "@cfware/this-module-will-never-exist";',
	options: {plugins: [[plugin, {failOnUnresolved: true}]]}
});

test('static http url', babelTest, {
	source: 'import mod from "http://example.com/";',
	result: 'import mod from "http://example.com/";'
});

test('static current dir', babelTest, {
	source: 'import mod from ".";',
	result: 'import mod from "./index.js";'
});

test('static parent dir', babelTest, {
	source: 'import mod from "..";',
	result: 'import mod from "../index.js";',
	options: {filename: 'test/test.js'}
});

test('static ignored path', babelTest, {
	source: 'import mod from "..";\nimport mod2 from "/src/test.js";',
	result: 'import mod from "../index.js";\nimport mod2 from "/src/test.js";',
	options: {
		filename: 'test/test.js',
		plugins: [[plugin, {
			ignorePrefixes: ['/']
		}]]
	}
});

test('export without from', babelTest, {
	source: 'export const id = "id".length();',
	result: 'export const id = "id".length();'
});

test('dynamic current dir', babelTest, {
	source: 'const mod = import(".");',
	result: 'const mod = import("./index.js");'
});

test('dynamic parent dir', babelTest, {
	source: 'const mod = import("..");',
	result: 'const mod = import("../index.js");',
	options: {filename: 'test/test.js'}
});

test('dynamic unresolved node package, failOnUnresolved', babelTest, {
	source: 'import("@cfware/this-module-will-never-exist");',
	result: 'import("@cfware/this-module-will-never-exist");',
	options: {plugins: [[plugin, {failOnUnresolved: true}]]}
});

test('dynamic invalid', babelTest, {
	source: 'const mod = import(1);',
	result: 'const mod = import(1);'
});
