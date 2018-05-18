import test from 'ava';
import {transform} from '@babel/core';
import plugin from '.';

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
		filename: 'file.js',
		plugins: [plugin],
		...options,
	});

	t.is(code, result);
	t.deepEqual(gotErrors, expectErrors);
	console.error = origError;
}

test('static node package', t => babelTest(t,
	`import mod from "is-windows";`,
	`import mod from "/node_modules/is-windows/index.js";`
));

test('static node package to package', t => babelTest(t,
	`import mod from "is-windows";`,
	`import mod from "../is-windows/index.js";`,
	{filename: 'node_modules/path-is-inside/index.js'}
));

test('static node package with alternate location', t => babelTest(t,
	`import mod from "is-windows";`,
	`import mod from "/assets/is-windows/index.js";`,
	{plugins: [[plugin, {modulesDir: '/assets'}]]}
));

test('static node package to package with alternate location', t => babelTest(t,
	`import mod from "is-windows";`,
	`import mod from "../is-windows/index.js";`,
	{
		plugins: [[plugin, {modulesDir: '/assets'}]],
		filename: 'node_modules/path-is-inside/index.js',
	}
));

test('static unresolved node package', t => babelTest(t,
	`import mod from "@babel/this-module-will-never-exist";`,
	`import mod from "@babel/this-module-will-never-exist";`,
	{expectErrors: [[`Could not resolve '@babel/this-module-will-never-exist' in file 'file.js'.`]]}
));

test('static http url', t => babelTest(t,
	`import mod from "http://example.com/";`,
	`import mod from "http://example.com/";`
));

test('static current dir', t => babelTest(t,
	`import mod from ".";`,
	`import mod from "./index.js";`
));

test('static parent dir', t => babelTest(t,
	`import mod from "..";`,
	`import mod from "../index.js";`,
	{filename: 'fixtures/file.js'}
));

test('export without from', t => babelTest(t,
	`export const id = "id".length();`,
	`export const id = "id".length();`
));

test('dynamic current dir', t => babelTest(t,
	`const mod = import(".");`,
	`const mod = import("./index.js");`
));

test('dynamic parent dir', t => babelTest(t,
	`const mod = import("..");`,
	`const mod = import("../index.js");`,
	{filename: 'fixtures/file.js'}
));

test('dynamic invalid', t => babelTest(t,
	`const mod = import(1);`,
	`const mod = import(1);`
));
