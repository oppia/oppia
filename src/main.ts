// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Entry point for angular AoT build.
 */

import 'pages/common-imports';
import {enableProdMode} from '@angular/core';
import {platformBrowser} from '@angular/platform-browser';
import {shouldUseLiteAppModule} from 'pages/oppia-root/bootstrap-module';

enableProdMode();

// Angular's production build is AoT-compiled, so the JIT compiler in
// platform-browser-dynamic is unnecessary here. The full root module is kept
// in a separate chunk because only non-target pages need it.
const platform = platformBrowser();

if (shouldUseLiteAppModule(window.location.pathname)) {
  // eslint-disable-next-line capitalized-comments
  import(/* webpackChunkName: "lite-app" */ 'pages/oppia-root/lite-app.module')
    .then(({LiteAppModule}) => platform.bootstrapModule(LiteAppModule))
    .catch(err => console.error(err));
} else {
  // eslint-disable-next-line capitalized-comments
  import(/* webpackChunkName: "full-app" */ 'pages/oppia-root/app.module')
    .then(({AppModule}) => platform.bootstrapModule(AppModule))
    .catch(err => console.error(err));
}
