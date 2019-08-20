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
 * @fileoverview Module for the community dashboard page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import { Component, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';

// This component is needed to force-bootstrap Angular at the beginning of the
// app.
@Component({
  selector: 'service-bootstrap',
  template: ''
})
export class ServiceBootstrapComponent {}

import { AppConstants } from 'app.constants';
import { CommunityDashboardConstants } from
  'pages/community-dashboard-page/community-dashboard-page.constants';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  declarations: [
    ServiceBootstrapComponent
  ],
  entryComponents: [
    ServiceBootstrapComponent
  ],
  providers: [
    AppConstants,
    CommunityDashboardConstants,
  ]
})
class CommunityDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(CommunityDashboardPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: any;

angular.module('oppia', [
  'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
  'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
  'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
  downgradedModule
].concat(
  window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || []) : []))
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  .directive(
    'serviceBootstrap',
    downgradeComponent({
      component: ServiceBootstrapComponent
    }) as angular.IDirectiveFactory);
