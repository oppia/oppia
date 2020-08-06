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
 * @fileoverview Module for the topic landing page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

angular.module('oppia', [
  'headroom', 'ngAnimate',
  require('angular-cookies'), 'ngMaterial',
  'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.validate'
]);

import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { TopicLandingPageComponent } from
  'pages/landing-pages/topic-landing-page/topic-landing-page.component';
import { RequestInterceptor } from 'services/request-interceptor.service';

import { AppConstants } from 'app.constants';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { ServicesConstants } from 'services/services.constants';
import { TopicLandingPageConstants } from
  'pages/landing-pages/topic-landing-page/topic-landing-page.constants';


@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    TopicLandingPageComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    TopicLandingPageComponent
  ],
  providers: [
    AppConstants,
    InteractionsExtensionsConstants,
    ObjectsDomainConstants,
    ServicesConstants,
    TopicLandingPageConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class TopicLandingPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(TopicLandingPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
