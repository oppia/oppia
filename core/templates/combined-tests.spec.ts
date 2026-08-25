// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Main entry point for the Angular 11 test target.
 *
 * This file initializes the Angular testing environment, sets up the
 * jasmine reporter, and explicitly discovers all spec files under
 * core/templates and extensions via require.context.
 */

// These polyfills are necessary to help the TestBed resolve parameters for
// ApplicationModule
// https://github.com/angular/angular/issues/29281

import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import {getTestBed} from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Note: In Angular 11, the native @angular-devkit/build-angular:karma builder
// still uses Webpack under the hood. We are required to have a custom main entry
// point with require.context so that the builder can discover our tests and initialize
// our custom Jasmine reporter. Once the codebase is upgraded to Angular 15+, we can
// safely delete this file and rely on the CLI's auto-discovery.
// NOTE - These types are defined by taking
// https://webpack.js.org/guides/dependency-management/#context-module-api
// as a reference.
interface RequireContext {
  context: (
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ) => Context;
}

interface Context {
  (request: Object): void;
  resolve: () => string;
  keys: () => Object[];
  id: string;
}

declare const require: RequireContext;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Load all spec files from core/templates and extensions.
// When Angular CLI's --include flag is used, the SingleTestTransformLoader
// replaces this require.context with direct imports for only the specified
// files. This MUST be a single-line require.context because the transform
// loader's regex (require.context\(.*) uses .* which cannot cross newlines.
const context = require.context(
  '../../',
  true,
  /(?:core\/templates|extensions)\/.*\.spec\.ts$/
);
context.keys().forEach(context);

jasmine.getEnv().addReporter({
  specDone: function (result) {
    // Specs that are being excluded when using fit or fdescribe will not
    // be reported.
    if (result.status !== 'excluded') {
      // eslint-disable-next-line no-console
      console.log('Spec: ' + result.fullName + ' has ' + result.status);
    }
  },
});
