// The following file finds all the spec files (except known failing files;
// corresponding issue -> https://github.com/oppia/oppia/issues/6960)
// and merges them all to a single file which Karma uses to run its tests. The
// Karma is unable to run the tests on multiple files and the DI fails in that
// case, the reason of which is unclear.
// (related issue -> https://github.com/oppia/oppia/issues/7053).

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
// Then we find all the tests.
/* eslint-disable max-len */
const context = require.context('../../../../', true, /(((\.s|S)pec)\.ts$)(?<!combined-tests\.spec\.ts)(?<!state-content-editor\.directive\.spec\.ts)(?<!MusicNotesInputSpec\.ts)(?<!state-interaction-editor\.directive\.spec\.ts)(?<!state-name-editor\.directive\.spec\.ts)(?<!solution-verification\.service\.spec\.ts)/);
/* eslint-enable max-len */
// And load the modules.
context.keys().map(context);
