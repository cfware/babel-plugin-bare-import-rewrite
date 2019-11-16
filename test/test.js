const path = require('path');
const t = require('tap');
const {transform} = require('@babel/core');
const plugin = require('../index.js');

const projectDir = path.resolve(__dirname, '..');
const nodeModules = path.resolve(projectDir, 'node_modules');
const nodeModulesRelative = path.join('.', 'node_modules');

async function babelTest(t, {source, result, options = {}, expectErrors = []}) {
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

		t.same(gotErrors, expectErrors);
		t.equal(code, result);
		console.error = origError;
	} catch (error) {
		if (options.plugins[0][1].failOnUnresolved) {
			t.type(error, Error);
			return;
		}

		throw error;
	}
}

const test = (name, helper, ...args) => t.test(name, t => helper(t, ...args));

const pluginInjectFakeModuleAtExit = ({types: t}) => ({
	visitor: {
		Program: {
			exit(path) {
				path.node.body.unshift(
					t.importDeclaration(
						[t.importDefaultSpecifier(t.identifier('mod'))],
						t.stringLiteral('@cfware/fake-module1')
					)
				);
			}
		}
	}
});

t.test('exports', async t => {
	t.type(plugin, 'function');
	t.type(plugin.resolve, 'function');
});

t.test('absolute resolve', async t => {
	const rootIndex = path.resolve(projectDir, 'index.js');
	const fakeModule1 = path.join(projectDir, 'node_modules/@cfware/fake-module1/index.js');
	const fakeModule2 = path.join(projectDir, 'node_modules/@cfware/fake-module2/index.js');
	const fakeSubModule1 = path.join(path.dirname(fakeModule2), 'node_modules/@cfware/fake-module1/index.js');
	const isWindowsSub = path.join(path.dirname(fakeModule2), 'node_modules/is-windows/index.js');
	const isWindows = require.resolve('is-windows');

	/* URL's untouched */
	t.equal(plugin.resolve('http://example.com/', rootIndex), 'http://example.com/');

	/* Find modules from root index.js */
	t.equal(plugin.resolve('./test/test.js', rootIndex), path.resolve(projectDir, 'test', 'test.js'));
	t.equal(plugin.resolve('@cfware/fake-module1', rootIndex), fakeModule1);
	t.equal(plugin.resolve('@cfware/fake-module2', rootIndex), fakeModule2);

	/* Find submodule */
	t.equal(plugin.resolve('@cfware/fake-module1', fakeModule2), fakeSubModule1);

	/* Avoid submodule */
	t.equal(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['@cfware/fake-module1']}), fakeModule1);
	t.equal(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['**']}), fakeModule1);

	/* Avoid submodules all except */
	t.equal(plugin.resolve('@cfware/fake-module1', fakeModule2, {
		alwaysRootImport: ['**'],
		neverRootImport: ['@cfware/fake-module1']
	}), fakeSubModule1);

	/* Avoid non-empty submodule list but not matching import */
	t.equal(plugin.resolve('@cfware/fake-module1', fakeModule2, {alwaysRootImport: ['@cfware/fake-module3']}), fakeSubModule1);

	/* Non-scoped module */
	t.equal(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['@cfware/fake-module1']}), isWindowsSub);
	t.equal(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['is-windows']}), isWindows);
	t.equal(plugin.resolve('is-windows', fakeModule2, {alwaysRootImport: ['**']}), isWindows);
});

test('import injected by another plugins Program.exit ignored by default', babelTest, {
	source: '',
	result: 'import mod from "@cfware/fake-module1";',
	options: {
		plugins: [
			plugin,
			pluginInjectFakeModuleAtExit
		]
	}
});

test('import injected by another plugins Program.exit seen with processAtProgramExit', babelTest, {
	source: '',
	result: 'import mod from "./node_modules/@cfware/fake-module1/index.js";',
	options: {
		plugins: [
			pluginInjectFakeModuleAtExit,
			[plugin, {processAtProgramExit: true}]
		]
	}
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
