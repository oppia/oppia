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

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests. Note that known failing files are exempted;
// corresponding issue -> https://github.com/oppia/oppia/issues/6960).
// TODO(YashJipkate): Fix the tests that broke down after introduction of
// Webpack due to templateCache.
/* eslint-disable max-len */
const context = require.context('../../../../', true, /(((\.s|S)pec)\.ts$)(?<!combined-tests\.spec\.ts)(?<!state-content-editor\.directive\.spec\.ts)(?<!MusicNotesInputSpec\.ts)(?<!state-interaction-editor\.directive\.spec\.ts)(?<!state-name-editor\.directive\.spec\.ts)(?<!solution-verification\.service\.spec\.ts)/);
/* eslint-enable max-len */
// And load the modules.
context.keys().map(context);
