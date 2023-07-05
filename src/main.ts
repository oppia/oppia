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
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { LighweightAppModule } from 'pages/lightweight-oppia-root/app.module';


enableProdMode();


platformBrowserDynamic().bootstrapModule(LighweightAppModule).catch(
  (err) => console.error(err)
);

// This prevents angular pages causing side effects to hybrid pages.
// TODO(#13080): Remove window.name statement from import.ts files
// after migration is complete.
window.name = '';
