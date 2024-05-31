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

const COMMON_MODULES_TO_EXCLUDE: Record<string, string[]> = {
  'core/templates/pages/splash-page/splash-page.module.ts': [],
  'core/templates/pages/login-page/login-page.module.ts': [],
  'core/templates/pages/signup-page/signup-page.module.ts': [],
  'core/templates/pages/admin-page/admin-page.module.ts': [],
  'core/templates/pages/learner-dashboard-page/learner-dashboard-page.module.ts':
    [],
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
    if (!url.startsWith(LOCALHOST_URL)) {
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
      if (
        COMMON_MODULES_TO_EXCLUDE[module] &&
        !COMMON_MODULES_TO_EXCLUDE[module].includes(this.goldenFilePath)
      ) {
        break;
      }
      this.collectedModules.push(module);
      break;
    }

    if (!matched) {
      const errorMessage = `No Angular module found for URL: ${url}`;
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
    browser.on('targetchanged', async (target: Target) => {
      const page = await target.page();
      if (!page) {
        return;
      }
      page.on('framenavigated', async (frame: Frame) => {
        const url = frame.url();
        TestToModulesMatcher.registerUrl(url);
      });
    });
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
      .filter(line => line);
    const missingGoldenFileModules = this.collectedModules.filter(
      module => !goldenFileModules.includes(module)
    );
    const extraGoldenFileModules = goldenFileModules.filter(
      module => !this.collectedModules.includes(module)
    );

    const generatedGoldenFilePath = this.goldenFilePath.replace(
      '.txt',
      '-generated.txt'
    );
    fs.mkdirSync(path.dirname(generatedGoldenFilePath), {recursive: true});
    fs.writeFileSync(generatedGoldenFilePath, this.collectedModules.join('\n'));
    if (missingGoldenFileModules.length > 0) {
      throw new Error(
        'The following Angular modules are missing from the golden file ' +
          `at the path ${this.goldenFilePath}:\n${missingGoldenFileModules.join('\n')}`
      );
    }
    if (extraGoldenFileModules.length > 0) {
      throw new Error(
        'The following Angular modules are extra in the golden file ' +
          `at the path ${this.goldenFilePath}:\n${extraGoldenFileModules.join('\n')}`
      );
    }
  }
}
