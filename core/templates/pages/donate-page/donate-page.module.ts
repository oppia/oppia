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
 * @fileoverview Module for the donate page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

angular.module('oppia', [
  'headroom', require('angular-cookies'), 'ngTouch', 'ngSanitize',
  'pascalprecht.translate', 'toastr', 'ui.bootstrap'
]);

import { NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppConstants } from 'app.constants';
import { DonatePageComponent } from './donate-page.component';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    DonatePageComponent
  ],
  entryComponents: [
    DonatePageComponent
  ],
  providers: [
    AppConstants,
    InteractionsExtensionsConstants,
    ObjectsDomainConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class DonatePageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(DonatePageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

angular.module('oppia').requires.push(downgradedModule);
