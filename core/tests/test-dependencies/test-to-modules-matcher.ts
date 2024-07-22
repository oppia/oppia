// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview This script is used to collect all the Angular modules that are
 * used by tests, by matching their URLs with Angular modules at runtime.
 */

import fs from 'fs';
import path from 'path';
import {
  DefaultUrlSerializer,
  UrlSegment,
  UrlSegmentGroup,
  Route,
} from '@angular/router';
import {Browser, Frame, Target} from 'puppeteer';
import {getRouteToModuleMapping} from './route-to-module-mapping-generator';
import {glob} from 'glob';

// A mapping of common modules that many tests use, so by default we will exclude them
// from being collected. Each excluded module also has an array of globs where if specified
// any golden file under that glob will not be excluded from collecting the module.
const COMMON_MODULES_TO_EXCLUDE: Record<string, string[]> = {
  'core/templates/pages/splash-page/splash-page.module.ts': [
    'core/tests/test-modules-mappings/acceptance/logged-in-user/set-language-to-rtl-and-navigate-through-site.txt',
  ],
  'core/templates/pages/login-page/login-page.module.ts': [
    'core/tests/test-modules-mappings/acceptance/logged-out-user/sign-in-and-save-exploration-progress.txt',
  ],
  'core/templates/pages/signup-page/signup-page.module.ts': [
    'core/tests/test-modules-mappings/acceptance/logged-out-user/sign-in-and-save-exploration-progress.txt',
  ],
  'core/templates/pages/admin-page/admin-page.module.ts': [
    'core/tests/test-modules-mappings/acceptance/super-admin/*',
  ],
  'core/templates/pages/learner-dashboard-page/learner-dashboard-page.module.ts':
    [
      'core/tests/test-modules-mappings/acceptance/logged-in-user/set-language-to-rtl-and-navigate-through-site.txt',
      'core/tests/test-modules-mappings/acceptance/logged-in-user/save-an-exploration-to-play-later.txt',
      'core/tests/test-modules-mappings/acceptance/logged-in-user/manage-goals-progress-and-lessons-from-learner-dashboard.txt',
    ],
};

const LOCALHOST_URL = 'http://localhost:8181/';

const matchUrl = (url: string, route: Route): boolean => {
  if (route.path === url) {
    return true;
  }

  const urlSerializer = new DefaultUrlSerializer();
  const urlTree = urlSerializer.parse(url);
  if (!urlTree.root.children.primary) {
    return false;
  }

  const segments: UrlSegment[] = urlTree.root.children.primary.segments;
  const segmentGroup: UrlSegmentGroup = urlTree.root.children.primary;

  if (route.path === undefined) {
    return false;
  }

  const parts = route.path.split('/');
  if (parts.length > segments.length) {
    return false;
  }

  if (
    route.pathMatch === 'full' &&
    (segmentGroup.hasChildren() || parts.length < segments.length)
  ) {
    return false;
  }

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const segment = segments[index];
    const partIsParameter = part.startsWith(':');
    if (partIsParameter) {
      continue;
    } else if (part !== segment.path) {
      return false;
    }
  }

  return true;
};

export class TestToModulesMatcher {
  static goldenFilePath: string;
  static routeToModuleMapping: Map<Route, string> = getRouteToModuleMapping();
  static collectedModules: string[] = [];
  static collectedErrors: string[] = [];

  /**
   * Sets the path of the golden file that contains the list of Angular modules
   * that are expected to be used by tests.
   */
  public static setGoldenFilePath(filePath: string): void {
    if (!filePath.endsWith('.txt')) {
      throw new Error('The golden file path must have a .txt extension.');
    }
    this.goldenFilePath = filePath;
  }

  /**
   * Registers a URL and matches it with an Angular module.
   */
  public static registerUrl(url: string): void {
    if (!url.startsWith(LOCALHOST_URL) || url.includes('/error')) {
      return;
    }
    const path = url.replace(LOCALHOST_URL, '');
    let matched = false;
    for (const [route, module] of this.routeToModuleMapping.entries()) {
      if (!matchUrl(path, route)) {
        continue;
      }
      matched = true;
      if (this.collectedModules.includes(module)) {
        break;
      }
      if (COMMON_MODULES_TO_EXCLUDE[module]) {
        let exclude = true;
        for (const globPattern of COMMON_MODULES_TO_EXCLUDE[module]) {
          const globMatcher = new glob.GlobSync(globPattern);
          exclude = !globMatcher.minimatch.match(this.goldenFilePath);
          if (!exclude) {
            break;
          }
        }

        if (exclude) {
          break;
        }
      }
      this.collectedModules.push(module);
      break;
    }

    if (!matched) {
      const errorMessage =
        `No Angular module found for URL: ${url}. Please ensure ` +
        'that the URL that is being navigated to is a valid Angular route. If it is ' +
        'a valid Angular route, please ensure that it is being correctly captured by the ' +
        'core/tests/test-dependencies/route-to-module-mapping-generator.ts script by ensuring ' +
        'that the URL is in a routing module or is manually mapped. For more information, ' +
        'please refer to the documentation here: https://github.com/oppia/oppia/wiki/Partial-CI-Tests-Structure.';
      if (!this.collectedErrors.includes(errorMessage)) {
        this.collectedErrors.push(errorMessage);
      }
    }
  }

  /**
   * Registers a Puppeteer browser and listens for frame navigations to match
   * URLs with Angular modules.
   */
  public static registerPuppeteerBrowser(browser: Browser): void {
    const registerTarget = async (target: Target) => {
      TestToModulesMatcher.registerUrl(target.url());
      const page = await target.page();
      if (!page) {
        return;
      }
      page.on('framenavigated', async (frame: Frame) => {
        const url = frame.url();
        TestToModulesMatcher.registerUrl(url);
      });
    };
    browser.on('targetcreated', registerTarget);
    browser.on('targetchanged', registerTarget);
  }

  /**
   * Checks if an array is sorted.
   */
  private static isArraySorted(array: string[]): boolean {
    for (let i = 0; i < array.length - 1; i++) {
      if (array[i] > array[i + 1]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Compares the collected Angular modules with the golden file that contains
   * the list of Angular modules that are expected to be used by tests.
   */
  public static compareCollectedModulesWithGoldenFile(): void {
    if (!this.goldenFilePath) {
      throw new Error('The golden file path has not been set.');
    }
    if (this.collectedErrors.length) {
      throw new Error(this.collectedErrors.join('\n'));
    }
    let goldenFileContent: string = '';
    if (fs.existsSync(this.goldenFilePath)) {
      goldenFileContent = fs.readFileSync(this.goldenFilePath, 'utf-8');
    }
    const goldenFileModules = goldenFileContent
      .split('\n')
      .map(module => module.trim())
      .filter(module => module !== '');
    const missingGoldenFileModules = this.collectedModules
      .filter(module => !goldenFileModules.includes(module))
      .sort();
    const extraGoldenFileModules = goldenFileModules
      .filter(module => !this.collectedModules.includes(module))
      .sort();

    fs.mkdirSync(path.dirname(this.goldenFilePath), {recursive: true});
    fs.writeFileSync(
      this.goldenFilePath,
      this.collectedModules.sort().join('\n') + '\n'
    );
    if (missingGoldenFileModules.length > 0) {
      throw new Error(
        'The following Angular modules are missing from the golden file ' +
          `at the path ${this.goldenFilePath}:\n${missingGoldenFileModules.join('\n')}.\n` +
          'Please add them to the golden file or copy and paste the uploaded github artifact ' +
          'into the golden file location. If the test was run locally, the golden file has ' +
          'been updated with the collected modules automatically.'
      );
    }
    if (extraGoldenFileModules.length > 0) {
      throw new Error(
        'The following Angular modules are extra in the golden file ' +
          `at the path ${this.goldenFilePath}:\n${extraGoldenFileModules.join('\n')}\n` +
          'Please remove them from the golden file or copy and paste the uploaded github artifact ' +
          'into the golden file location. If the test was run locally, the golden file has ' +
          'been updated with the collected modules automatically.'
      );
    }
    if (!this.isArraySorted(goldenFileModules)) {
      throw new Error(
        `The modules in the golden file at the path ${this.goldenFilePath} is not sorted. ` +
          'Please ensure that the modules are sorted in ascending order. The sorted modules are:\n' +
          `${this.collectedModules.sort().join('\n')}. If the test was run locally, the golden file ` +
          'has been updated with the collected modules automatically.'
      );
    }
  }
}
