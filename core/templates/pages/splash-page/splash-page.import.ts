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
 * @fileoverview Directive scripts for the splash page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

// TODO(#13080): Remove the mock-ajs.ts file after the migration is complete.
import 'pages/mock-ajs';
import 'Polyfills.ts';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { SplashPageModule } from './splash-page.module';
import { AppConstants } from 'app.constants';
import { enableProdMode } from '@angular/core';

if (!AppConstants.DEV_MODE) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(SplashPageModule).catch(
  // eslint-disable-next-line no-console
  (err) => console.error(err)
);

// This prevents angular pages to cause side effects to hybrid pages.
// TODO(#13080): Remove window.name statement from import.ts files
// after migration is complete.
window.name = '';
