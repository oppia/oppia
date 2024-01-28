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
 * @fileoverview Karma spec files accumulator.
 */

// The following file finds all the spec files and merges them all to a single
// file which Karma uses to run its tests. The Karma is unable to run the tests
// on multiple files and the DI fails in that case, the reason of which is
// unclear (related issue -> https://github.com/oppia/oppia/issues/7053).

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
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// NOTE - These types are defined by taking
// https://webpack.js.org/guides/dependency-management/#context-module-api
// as a reference.
interface RequireContext {
  context: (
      directory: string, useSubdirectories: boolean, regExp: RegExp) => Context;
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

jasmine.getEnv().addReporter({
  specDone: function(result) {
    // Specs that are being excluded when using fit or fdescribe will not
    // be reported.
    if (result.status !== 'excluded') {
      // eslint-disable-next-line no-console
      console.log('Spec: ' + result.fullName + ' has ' + result.status);
    }
  }
});

// Then we find all the tests, as well as any controller, directive,
// service/factory files.
// All files from the services_sources folder are exempted, because they
// shouldn't be tested (those files are just intended as data files for backend
// tests).
// Known failing files are exempted (#6960).
// TODO(#6960): Fix the tests that broke down after introduction of Webpack due
//              to templateCache.
// The '@nodelib' and 'openapi3-ts' are excluded from the tests since they are
// coming from third party library.
/* eslint-disable-next-line max-len */
const context = require.context('../../', true, /((\.s|S)pec\.ts$|(?<!services_sources)\/[\w\d.\-]*(component|controller|directive|service|Factory)\.ts$)(?<!combined-tests\.spec\.ts)(?<!state-content-editor\.directive\.spec\.ts)(?<!music-notes-input\.spec\.ts)(?<!state-interaction-editor\.directive\.spec\.ts)(?<!@nodelib.*\.spec\.ts)(?<!openapi3-ts.*\.spec\.ts)(?<!(valid|invalid)[_-][\w\d.\-]*\.ts)/);

// And load the modules.
context.keys().map(context);
