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
 *
 * This file initializes the Angular testing environment and sets up
 * the jasmine reporter. The Angular CLI's karma builder handles file
 * discovery and preprocessing automatically.
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

// Declare webpack's require.context for dynamic module loading.
declare var require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Load all spec files from core/templates and extensions.
const testsContext = require.context(
  '../../core/templates',
  true,
  /\.spec\.ts$/
);
testsContext.keys().forEach(testsContext);

const extensionsContext = require.context(
  '../../extensions',
  true,
  /\.spec\.ts$/
);
extensionsContext.keys().forEach(extensionsContext);

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
