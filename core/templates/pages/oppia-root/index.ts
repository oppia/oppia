// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive scripts for the oppia pages.
 */

import 'pages/common-imports';
import {AppConstants} from 'app.constants';
import {enableProdMode} from '@angular/core';
import {LoggerService} from 'services/contextual/logger.service';
import {shouldUseLiteAppModule} from './bootstrap-module';

if (!AppConstants.DEV_MODE) {
  enableProdMode();
}

const loggerService = new LoggerService();

// Match the production entry point: the two target pages use the lightweight
// Angular module, while every other page uses the full application module.
import('@angular/platform-browser-dynamic')
  .then(({platformBrowserDynamic}) => {
    if (shouldUseLiteAppModule(window.location.pathname)) {
      return import('./lite-app.module').then(({LiteAppModule}) =>
        platformBrowserDynamic().bootstrapModule(LiteAppModule)
      );
    }
    return import('./app.module').then(({AppModule}) =>
      platformBrowserDynamic().bootstrapModule(AppModule)
    );
  })
  .catch(err => loggerService.error(err));
